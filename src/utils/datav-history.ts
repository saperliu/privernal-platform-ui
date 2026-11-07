/**
 * 撤销栈：按组件驻留共享的快照池
 *
 * 原来每步存整份 schema 的 JSON 字符串，100 个组件的画布拖 200 步就是 200 份完整拷贝，
 * 内存随步数线性涨，而每步真正变动的往往只有一个组件的 x/y。
 *
 * 这里把快照拆成「头部（版本/画布/参数/分组）+ 每个组件一段」，逐段字符串驻留进池：
 * 没动的组件在下一步产出**完全相同的字符串**，于是只多一个数字下标，不再多一份拷贝。
 * 之所以按字符串驻留而不是直接共享对象引用——store 里的 action 是就地改对象的
 * （`Object.assign(target, patch)`），共享引用会让历史被后续编辑追溯性地改掉，
 * 那是比内存更糟的错。字符串不可变，共享才安全。
 *
 * 池里带引用计数：撤销分支被丢弃、或超出上限挤掉最早一步时，对应段落计数归零才真正释放。
 */

/** 一份快照拆成可驻留的两部分 */
export interface SchemaShards {
  head: string;
  widgets: string[];
}

interface Entry {
  head: number;
  widgets: number[];
}

/** 一段字符串按 UTF-16 估算占用（JS 字符串实际还可能更省，这里取保守上界） */
function byteSize(text: string): number {
  return text.length * 2 + 32;
}

export function shardSchema(schema: DatavNamespace.ScreenSchema): SchemaShards {
  const { widgets, ...rest } = schema;
  return { head: JSON.stringify(rest), widgets: widgets.map(item => JSON.stringify(item)) };
}

/** 把驻留段还原成可交给 migrateSchema 的对象；顺序即历史里的组件顺序 */
export function assembleShards(shards: SchemaShards): unknown {
  const head = JSON.parse(shards.head);
  return { ...head, widgets: shards.widgets.map(item => JSON.parse(item)) };
}

export interface SchemaHistory {
  /** 记一步；与当前步完全相同时不重复入栈，返回新的游标 */
  push(shards: SchemaShards): number;

  /** 换屏：清空并压入初始快照 */
  reset(shards: SchemaShards): number;

  /** 离开编辑器：清空且不留基线（游标回到 -1，canUndo 为假） */
  clear(): void;

  at(index: number): SchemaShards | null;

  /** 游标只由池自己持有：store 再存一份就会两边不一致，redo 分支丢不丢全看谁先被读到 */
  undo(): SchemaShards | null;

  redo(): SchemaShards | null;

  readonly index: number;
  readonly size: number;
  readonly canUndo: boolean;
  readonly canRedo: boolean;

  /** 池内驻留字节估算，用于「200 步 < 50MB」这类验收 */
  readonly bytes: number;

  readonly segmentCount: number;
}

export function createSchemaHistory(limit = 200): SchemaHistory {
  const pool = new Map<string, number>();
  /** 驻留下标 → 原文。释放后的下标留空串，不会再被任何 entry 指到 */
  const keys: string[] = [];
  const sizes: number[] = [];
  const refs: number[] = [];
  const entries: Entry[] = [];
  let cursor = -1;
  let bytes = 0;

  function intern(text: string): number {
    const existing = pool.get(text);
    if (existing !== undefined) return existing;
    const id = keys.length;
    pool.set(text, id);
    keys.push(text);
    sizes.push(byteSize(text));
    refs.push(0);
    bytes += sizes[id];
    return id;
  }

  function release(id: number): void {
    refs[id] -= 1;
    if (refs[id] > 0) return;
    // 计数归零才算真的释放：同一段可能被几十步共享
    pool.delete(keys[id]);
    keys[id] = '';
    bytes -= sizes[id];
    sizes[id] = 0;
  }

  function retain(shards: SchemaShards): Entry {
    const entry: Entry = { head: intern(shards.head), widgets: shards.widgets.map(item => intern(item)) };
    refs[entry.head] += 1;
    entry.widgets.forEach(id => (refs[id] += 1));
    return entry;
  }

  function drop(index: number): void {
    const entry = entries[index];
    if (!entry) return;
    release(entry.head);
    entry.widgets.forEach(id => release(id));
  }

  /** 丢掉游标之后的 redo 分支 */
  function dropForward(): void {
    while (entries.length - 1 > cursor) {
      drop(entries.length - 1);
      entries.pop();
    }
  }

  /** 超出上限时挤掉最早的步骤（挤的是数组头部，所以游标要跟着左移） */
  function enforceLimit(): void {
    while (entries.length > limit) {
      drop(0);
      entries.shift();
      cursor -= 1;
    }
    if (cursor < -1) cursor = -1;
  }

  return {
    push(shards: SchemaShards): number {
      const current = cursor >= 0 ? entries[cursor] : null;
      const nextHead = pool.get(shards.head);
      // 与当前步逐段比对而不是比整串：一次纯取数、没有配置变化的操作不该占一条历史
      if (
        current &&
        nextHead !== undefined &&
        nextHead === current.head &&
        current.widgets.length === shards.widgets.length &&
        shards.widgets.every((widget, index) => pool.get(widget) === current.widgets[index])
      ) {
        return cursor;
      }
      dropForward();
      entries.push(retain(shards));
      cursor = entries.length - 1;
      enforceLimit();
      return cursor;
    },

    reset(shards: SchemaShards): number {
      while (entries.length > 0) {
        drop(entries.length - 1);
        entries.pop();
      }
      cursor = -1;
      entries.push(retain(shards));
      cursor = 0;
      return cursor;
    },

    clear(): void {
      while (entries.length > 0) {
        drop(entries.length - 1);
        entries.pop();
      }
      cursor = -1;
    },

    at(index: number): SchemaShards | null {
      const entry = entries[index];
      if (!entry) return null;
      return {
        head: keys[entry.head],
        widgets: entry.widgets.map(id => keys[id])
      };
    },

    undo(): SchemaShards | null {
      if (cursor <= 0) return null;
      cursor -= 1;
      return this.at(cursor);
    },

    redo(): SchemaShards | null {
      if (cursor >= entries.length - 1) return null;
      cursor += 1;
      return this.at(cursor);
    },

    get index(): number {
      return cursor;
    },

    get size(): number {
      return entries.length;
    },

    get canUndo(): boolean {
      return cursor > 0;
    },

    get canRedo(): boolean {
      return cursor < entries.length - 1;
    },

    get bytes(): number {
      return bytes;
    },

    get segmentCount(): number {
      return sizes.length;
    }
  };
}

import { ref } from 'vue';
import { findSystemDictionaryDataList } from '@/service';

export interface ScheduleDicts {
  /** 任务来源：MANUAL/WORKFLOW/… → 中文 */
  source: Map<string, string>;

  /** 任务动作：MESSAGE_NOTIFY/BEAN/… → 中文 */
  action: Map<string, string>;

  /** 任务状态：READY/PAUSED/… → 中文 */
  status: Map<string, string>;
}

/**
 * 任务管理的三类字典（schedule_source / schedule_action / schedule_status）。
 * 字典缺失的值回退原文编码——新增枚举没配字典时列表也不至于空白。
 */
export function useScheduleDicts() {
  const dicts = ref<ScheduleDicts>({ source: new Map(), action: new Map(), status: new Map() });

  async function load() {
    const entries = await Promise.all([
      findSystemDictionaryDataList({ dictType: 'schedule_source', pageNum: 1, pageSize: 50 }),
      findSystemDictionaryDataList({ dictType: 'schedule_action', pageNum: 1, pageSize: 50 }),
      findSystemDictionaryDataList({ dictType: 'schedule_status', pageNum: 1, pageSize: 50 })
    ]);
    const toMap = (rows?: SystemDictionaryDataNamespace.SystemDictionaryDataForm[] | null) =>
      new Map((rows ?? []).map(item => [`${item.dictValue}`, item.dictLabel]));
    dicts.value = {
      source: toMap(entries[0].data?.list),
      action: toMap(entries[1].data?.list),
      status: toMap(entries[2].data?.list)
    };
  }

  return { dicts, load };
}

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useDatavStore } from '@/store';
import { readPath, writePath } from '@/packages/components/protocol';
import type { WidgetFieldSchema } from '@/packages/components/protocol';

defineOptions({ name: 'DatavConfigForm' });

const props = defineProps<{ fields: WidgetFieldSchema[]; widget: DatavNamespace.Widget }>();

const store = useDatavStore();

/**
 * 正在输入但尚未提交的文本类值
 *
 * 文本域必须在失焦或回车时才写入历史：每次按键记一条的话，撤销一次只退一个字，
 * 用户会被迫按几十次 Ctrl+Z 才能回到想要的状态。
 */
const drafts = ref<Record<string, string>>({});

// 切换选中组件时丢弃上一个组件的未提交输入，避免跨组件串值
watch(
  () => props.widget.id,
  () => {
    drafts.value = {};
    // 上一个组件的滑块改动先落历史，不然切走后那次改动会永远不进栈
    store.flushStyleCommit();
  }
);

function isDataField(field: WidgetFieldSchema) {
  return field.key.startsWith('data.');
}

function pathOf(field: WidgetFieldSchema) {
  return isDataField(field) ? field.key.slice('data.'.length) : field.key;
}

function sourceOf(field: WidgetFieldSchema): Record<string, unknown> {
  return (isDataField(field) ? props.widget.data : props.widget.style) as unknown as Record<string, unknown>;
}

function valueOf(field: WidgetFieldSchema): unknown {
  return readPath(sourceOf(field), pathOf(field));
}

/**
 * @param live 滑块与步进按钮这类连续写入走这里：改动照常生效，但只在停手后压一条历史
 */
function setValue(field: WidgetFieldSchema, value: unknown, live = false) {
  const target: Record<string, unknown> = JSON.parse(JSON.stringify(sourceOf(field) ?? {}));
  writePath(target, pathOf(field), value);
  if (isDataField(field)) store.updateWidgetData(props.widget.id, target);
  else if (live) store.updateWidgetStyleLive(props.widget.id, target);
  else store.updateWidgetStyle(props.widget.id, target);
}

function draftValue(field: WidgetFieldSchema): string {
  if (field.key in drafts.value) return drafts.value[field.key];
  const raw = valueOf(field);
  if (field.control === 'json') {
    try {
      return JSON.stringify(raw ?? {}, null, 2);
    } catch {
      return '{}';
    }
  }
  return raw === null || raw === undefined ? '' : String(raw);
}

function onInput(field: WidgetFieldSchema, value: string) {
  drafts.value[field.key] = value;
}

function commitText(field: WidgetFieldSchema) {
  if (!(field.key in drafts.value)) return;
  const text = drafts.value[field.key];
  Reflect.deleteProperty(drafts.value, field.key);
  if (field.control === 'json') {
    try {
      setValue(field, JSON.parse(text === '' ? '{}' : text));
    } catch {
      window.$message?.error(`${field.label} 不是合法 JSON，已放弃本次修改`);
    }
    return;
  }
  setValue(field, text);
}

const groups = computed(() => {
  const map = new Map<string, WidgetFieldSchema[]>();
  props.fields.forEach(field => {
    const key = field.group || '常规';
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(field);
  });
  return [...map].map(([label, fields]) => ({ label, fields }));
});

function numberValue(field: WidgetFieldSchema) {
  const raw = valueOf(field);
  return typeof raw === 'number' && Number.isFinite(raw) ? raw : undefined;
}

/** ElSelect / ElRadioGroup 的 model-value 不接受 unknown，这里按可选标量收窄 */
function scalarValue(field: WidgetFieldSchema): string | number | undefined {
  const raw = valueOf(field);
  if (typeof raw === 'string' || typeof raw === 'number') return raw;
  return undefined;
}

function boolValue(field: WidgetFieldSchema) {
  return Boolean(valueOf(field));
}
</script>

<template>
  <div v-if="fields.length === 0" class="text-12px opacity-60">该组件无可配置项</div>

  <ElForm v-else label-position="top" size="small">
    <template v-for="group in groups" :key="group.label">
      <div v-if="groups.length > 1" class="mb-6px mt-10px text-12px font-600 opacity-70">{{ group.label }}</div>

      <ElFormItem v-for="field in group.fields" :key="field.key">
        <template #label>
          <span>{{ field.label }}</span>
          <span v-if="field.tip" class="ml-6px text-12px font-400 opacity-50">{{ field.tip }}</span>
        </template>

        <ElInput
          v-if="field.control === 'text'"
          :model-value="draftValue(field)"
          :placeholder="field.placeholder"
          @update:model-value="v => onInput(field, String(v))"
          @change="() => commitText(field)"
          @blur="() => commitText(field)"
        />

        <ElInput
          v-else-if="field.control === 'textarea'"
          :model-value="draftValue(field)"
          type="textarea"
          :rows="3"
          :placeholder="field.placeholder"
          @update:model-value="v => onInput(field, String(v))"
          @change="() => commitText(field)"
          @blur="() => commitText(field)"
        />

        <div v-else-if="field.control === 'number'" class="flex items-center gap-6px">
          <ElInputNumber
            :model-value="numberValue(field)"
            :min="field.min"
            :max="field.max"
            :step="field.step ?? 1"
            @change="v => v !== null && v !== undefined && setValue(field, Number(v), true)"
          />
          <span v-if="field.unit" class="text-12px opacity-60">{{ field.unit }}</span>
        </div>

        <div v-else-if="field.control === 'slider'" class="w-full flex items-center gap-8px">
          <!--
 只接 update:model-value，绝不接 @change：ElSlider 的 change 带出去的是 props.modelValue
               而不是刚拖出来的新值（element-plus use-slide 的 emitChange），单向绑定下它永远等于旧值，
               于是接了 change 会把新值写回旧值、内部 firstValue 又被 props  watcher 拉回 —— 表现就是拖完回弹。
               颜色/数字控件没这个坑，它们的 change 带的是新值。
               走 live 提交：拖动期间每帧都在写，逐帧压栈会让一次拖动堆出几十条撤销记录。 
-->
          <ElSlider
            :model-value="numberValue(field) ?? field.min ?? 0"
            :min="field.min ?? 0"
            :max="field.max ?? 100"
            :step="field.step ?? 1"
            class="flex-1"
            @update:model-value="v => setValue(field, Number(v), true)"
          />
          <span class="w-48px text-right text-12px">{{ numberValue(field) ?? '—' }}{{ field.unit || '' }}</span>
        </div>

        <ElSwitch
          v-else-if="field.control === 'switch'"
          :model-value="boolValue(field)"
          @update:model-value="v => setValue(field, Boolean(v))"
        />

        <div v-else-if="field.control === 'color'" class="w-full flex items-center gap-8px">
          <ElColorPicker
            :model-value="valueOf(field) as string"
            show-alpha
            @change="v => setValue(field, String(v ?? ''))"
          />
          <ElInput
            class="flex-1"
            :model-value="draftValue(field)"
            placeholder="token 名（datav-accent）或色值"
            @update:model-value="v => onInput(field, String(v))"
            @change="() => commitText(field)"
            @blur="() => commitText(field)"
          />
        </div>

        <ElSelect
          v-else-if="field.control === 'select'"
          :model-value="scalarValue(field)"
          class="w-full"
          @update:model-value="v => setValue(field, v)"
        >
          <ElOption v-for="opt in field.options ?? []" :key="String(opt.value)" :label="opt.label" :value="opt.value" />
        </ElSelect>

        <ElRadioGroup
          v-else-if="field.control === 'radio'"
          :model-value="scalarValue(field)"
          @update:model-value="v => setValue(field, v)"
        >
          <ElRadioButton v-for="opt in field.options ?? []" :key="String(opt.value)" :value="opt.value">
            {{ opt.label }}
          </ElRadioButton>
        </ElRadioGroup>

        <ElInput
          v-else-if="field.control === 'json'"
          :model-value="draftValue(field)"
          type="textarea"
          :rows="4"
          @update:model-value="v => onInput(field, String(v))"
          @blur="() => commitText(field)"
        />
      </ElFormItem>
    </template>
  </ElForm>
</template>

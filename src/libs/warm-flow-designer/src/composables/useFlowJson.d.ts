import { ComputedRef, Ref } from 'vue';
import { FlowDesignerInstance } from '../designer/types';
/**
 * useFlowJson 返回值：流程 json 的响应式只读视图 + 同步入口 + 可直接展开到 FlowDesigner 的事件集合。
 */
export interface UseFlowJsonReturn {
    /** 最近一次同步的可保存流程 json 字符串（响应式，随 ready / change / saved 自动刷新） */
    json: Ref<string>;
    /** json 解析后的对象（解析失败为 null） */
    data: ComputedRef<any>;
    /** 当前是否有未保存的画布改动（随 dirty 事件同步） */
    dirty: Ref<boolean>;
    /** 手动从设计器拉取最新 json（返回拉取到的字符串） */
    sync: () => string;
    /**
     * 事件监听集合，直接展开到设计器即自动驱动同步：
     * `<FlowDesigner ref="designerRef" v-on="flowJson.bind" />`
     * 包含 onReady / onChange / onSaved（刷新 json）与 onDirty（同步 dirty）。
     */
    bind: Record<string, (...args: any[]) => void>;
}
/**
 * 流程 json 响应式读取组合式封装。
 *
 * 设计取舍（与待拍板的 `v-model:json` 区分）：本 hook 是**单向读**——把设计器当前 json
 * 同步成响应式 `json` / `data`，便于实时预览、外部展示、脏检测；**不做反向写回画布**
 * （写入仍走 `props.initialJson` + `:key` 重挂载，避免双向绑定的回环 / 脏检测取舍）。
 *
 * 用法：与模板 ref（或 useFlowDesigner 的 designerRef）配合，并把 `bind` 展开到设计器上。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { ref } from 'vue'
 * import { FlowDesigner, useFlowJson } from '@dromara/warm-flow-designer'
 * import type { FlowDesignerInstance } from '@dromara/warm-flow-designer'
 * const designerRef = ref<FlowDesignerInstance | null>(null)
 * const { json, data, dirty } = useFlowJson(designerRef)
 * </script>
 * <template>
 *   <FlowDesigner ref="designerRef" :initial-json="initial" v-on="useFlowJson(designerRef).bind" />
 *   <pre>{{ json }}</pre>
 * </template>
 * ```
 *
 * @author warm
 */
export declare function useFlowJson(designerRef: Ref<FlowDesignerInstance | null>): UseFlowJsonReturn;

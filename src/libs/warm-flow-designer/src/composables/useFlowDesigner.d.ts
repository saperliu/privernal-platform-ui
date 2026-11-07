import { Ref } from 'vue';
import { FlowDesignerInstance } from '../designer/types';
export type { FlowDesignerInstance };
/**
 * useFlowDesigner 返回值：模板 ref + 与 FlowDesignerInstance 同名的命令式方法（带空安全包装）。
 */
export interface UseFlowDesignerReturn extends FlowDesignerInstance {
    /** 绑定到 `<FlowDesigner ref="designerRef" />` 的模板 ref */
    designerRef: Ref<FlowDesignerInstance | null>;
    /** 设计器是否已挂载（命令式 API 是否可用） */
    isReady: () => boolean;
}
/**
 * 流程设计器命令式 API 组合式封装。
 *
 * 相比直接用模板 ref，本 hook 额外提供：
 * - 空安全：组件尚未挂载时调用方法不会抛错，仅 warn 并返回安全默认值；
 * - 解构友好：`const { designerRef, save, getFlowJson } = useFlowDesigner()`；
 * - 类型完备：方法签名与 FlowDesignerInstance 完全一致，IDE 自动补全。
 *
 * @example
 * ```vue
 * <script setup lang="ts">
 * import { FlowDesigner, useFlowDesigner } from '@dromara/warm-flow-designer'
 * const { designerRef, save, getFlowJson } = useFlowDesigner()
 * </script>
 * <template>
 *   <FlowDesigner ref="designerRef" :definition-id="id" />
 *   <button @click="save">保存</button>
 * </template>
 * ```
 *
 * @author warm
 */
export declare function useFlowDesigner(): UseFlowDesignerReturn;

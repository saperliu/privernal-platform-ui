/**
 * 中性透传组件工厂：按「语义名」生成一个包装组件，运行时渲染当前 UI 适配器
 * （默认 Element Plus）注册的对应组件，实现「设计器视图与具体 UI 库解耦」。
 *
 * - props / 事件：经 `$attrs` 整体透传（inheritAttrs:false + 显式 v-bind），含 v-model。
 * - 插槽：默认 / 具名 / 作用域插槽通用转发。
 * - ref：通过 `expose` 代理把对包装组件的 ref 访问（如 form.validate() / input.focus()）
 *   转发到内部真实组件实例，调用方 ref 用法无感。
 *
 * 注意：对「父组件按子组件类型自省」的耦合组件（如 el-table/el-table-column 读取列定义），
 * 通用包装可能不被父组件识别，这类需单独验证或特殊处理，不可盲目套用。
 *
 * @author warm
 */
export declare function createNeutralComponent(name: string, registryKey: string): import('vue').DefineComponent<{}, () => import('vue').VNode<import('vue').RendererNode, import('vue').RendererElement, {
    [key: string]: any;
}>, {}, {}, {}, import('vue').ComponentOptionsMixin, import('vue').ComponentOptionsMixin, {}, string, import('vue').VNodeProps & import('vue').AllowedComponentProps & import('vue').ComponentCustomProps, Readonly<import('vue').ExtractPropTypes<{}>>, {}, {}>;

<script setup lang="ts">
import '@wangeditor/editor/dist/css/style.css';
import { computed, onBeforeUnmount, ref, shallowRef, watch } from 'vue';
import { Editor as __forwarded_Editor, Toolbar as __forwarded_Toolbar } from '@wangeditor/editor-for-vue';
import type { IDomEditor } from '@wangeditor/core';

export interface Props {
  /** 是否显示 */
  show: boolean;
  /** 内容 */
  value: string;
  /** 模式 */
  mode?: string;
  /** 是否禁用 */
  disabled?: boolean;
}
defineOptions({ name: 'PrivernalEditor' });
const props = withDefaults(defineProps<Props>(), {
  show: false,
  value: '',
  mode: 'default',
  disabled: true,
  description: ''
});

interface Emits {
  (e: 'update:value', data: any): void;
  (e: 'onCreated', data: IDomEditor): void;
  (e: 'onChange', data: IDomEditor): void;
  (e: 'onDestroyed', data: IDomEditor): void;
  (e: 'onFocus', data: IDomEditor): void;
  (e: 'onBlur', data: IDomEditor): void;
  (e: 'customAlert', info: string, type: string): void;
  (e: 'customPaste', editor: IDomEditor, event: ClipboardEvent): void;
}

const emit = defineEmits<Emits>();

// 编辑器实例，必须用 shallowRef，重要！
const editorRef = shallowRef();

// 内容 HTML
// const valueHtml = ref('');

// 模拟 ajax 异步获取内容
// onMounted(() => {
//   setTimeout(() => {
//     valueHtml.value = '';
//   }, 1500);
// });

const toolbarConfig = ref({
  excludeKeys: ['fullScreen', 'uploadImage', 'uploadVideo']
});

const editorConfig = { placeholder: '请输入内容...' };

// 组件销毁时，也及时销毁编辑器，重要！
onBeforeUnmount(() => {
  const editor = editorRef.value;
  if (editor === null) return;
  // console.log("",editor.getAllMenuKeys() ) // 当前菜单排序和分组
  editor.destroy();
});

const selectValue = computed({
  get() {
    return props.value;
  },
  set(value) {
    emit('update:value', value);
  }
});

// 编辑器回调函数
const handleCreated = (editor: IDomEditor) => {
  console.log('created', editor);
  editorRef.value = editor; // 记录 editor 实例，重要！
  if (props.disabled) {
    editor.disable();
  }
  emit('onCreated', editor);
};
const handleChange = (editor: IDomEditor) => {
  console.log('change:', editor.getHtml());
  emit('onChange', editor);
};
const handleDestroyed = (editor: IDomEditor) => {
  console.log('destroyed', editor);
  emit('onDestroyed', editor);
};
const handleFocus = (editor: IDomEditor) => {
  console.log('focus', editor);
  emit('onFocus', editor);
};
const handleBlur = (editor: IDomEditor) => {
  console.log('blur', editor);
  emit('onBlur', editor);
};
const customAlert = (info: string, type: string) => {
  console.log(`【自定义提示】${type} - ${info}`);
  emit('customAlert', info, type);
};
const customPaste = (editor: IDomEditor, event: ClipboardEvent) => {
  emit('customPaste', editor, event);
  console.log('ClipboardEvent 粘贴事件对象', event);

  // 自定义插入内容
  // editor.insertText('xxx');

  // 返回值（注意，vue 事件的返回值，不能用 return）
  // callback(false); // 返回 false ，阻止默认粘贴行为
  // callback(true) // 返回 true ，继续默认的粘贴行为
};

watch(
  () => props.disabled,
  newValue => {
    if (newValue) {
      const editor = editorRef.value;
      if (editor === null) return;
      editor.disable();
    } else {
      const editor = editorRef.value;
      if (editor === null) return;
      editor.enable();
    }
  }
);
// return {
//   editorRef,
//   mode: 'default',
//   valueHtml,
//   toolbarConfig,
//   editorConfig,
//   handleCreated,
//   handleChange,
//   handleDestroyed,
//   handleFocus,
//   handleBlur,
//   customAlert,
//   customPaste,
//   insertText,
//   printHtml,
//   disable
// };

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const Editor = __forwarded_Editor;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const Toolbar = __forwarded_Toolbar;
</script>

<template>
  <div v-if="show">
    <div style="border: 1px solid #ccc; margin-top: 10px">
      <Toolbar :editor="editorRef" :default-config="toolbarConfig" :mode="mode" style="border-bottom: 1px solid #ccc" />
      <Editor
        v-model="selectValue"
        :default-config="editorConfig"
        :mode="mode"
        style="height: 400px; overflow-y: hidden"
        @on-created="handleCreated"
        @on-change="handleChange"
        @on-destroyed="handleDestroyed"
        @on-focus="handleFocus"
        @on-blur="handleBlur"
        @custom-alert="customAlert"
        @custom-paste="customPaste"
      />
    </div>
  </div>
</template>

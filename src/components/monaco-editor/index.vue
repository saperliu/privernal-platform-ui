<script setup lang="ts">
import { nextTick, onMounted, ref, watch } from 'vue';
import * as monaco from 'monaco-editor';
import type { editor } from 'monaco-editor';
// monaco 0.56 的 exports 映射不接受 esm/vs 前缀深路径，须用 editor/、language/ 前缀；
// vite 下自托管 worker（替代 vite-plugin-monaco-editor-esm，rolldown-vite 解析不了
// 该插件生成的裸模块 worker 路径）；java 等基础语言只需 editor worker，ts/js 需要 ts worker
import EditorWorker from 'monaco-editor/editor/editor.worker.js?worker';
import TsWorker from 'monaco-editor/language/typescript/ts.worker.js?worker';
import { useThemeStore } from '@/store/modules/theme';

globalThis.MonacoEnvironment = {
  getWorker(_workerId: string, label: string) {
    if (label === 'typescript' || label === 'javascript') {
      return new TsWorker();
    }
    return new EditorWorker();
  }
};

const props = withDefaults(
  defineProps<{
    language?: string;
    readOnly?: boolean;
    valueFormat?: string;
    modelValue?: any;
    config?: editor.IStandaloneEditorConstructionOptions;
    lineNumbers?: 'on' | 'off';
    autoToggleTheme?: boolean;
    theme?: 'vs-light' | 'vs-dark' | 'hc-black';
  }>(),
  {
    language: 'java',
    readOnly: false,
    valueFormat: 'string',
    lineNumbers: 'on',
    theme: 'vs-light',
    config: () => ({
      selectOnLineNumbers: true,
      minimap: {
        enabled: false
      }
    })
  }
);

const emit = defineEmits(['update:modelValue']);

const editContainer = ref<HTMLElement | null>(null);

const themeStore = useThemeStore();

let monacoEditor: monaco.editor.IStandaloneCodeEditor | null = null;

/** 跟随应用深色模式切换 monaco 主题（原 phoenix-designer 的 useTheme().isDark 在本项目由 themeStore.darkMode 提供） */
function handleToggleTheme() {
  monaco.editor.setTheme(themeStore.darkMode ? 'vs-dark' : 'vs-light');
}

/**
 * 设置文本
 *
 * @param text
 */
function setValue(text: string) {
  monacoEditor?.setValue(text || '');
}

/**
 * 光标处插入文本
 *
 * @param text
 */
function insertText(text: string) {
  // 获取光标位置
  const position = monacoEditor?.getPosition();
  // 未获取到光标位置信息
  if (!position) {
    return;
  }
  // 插入
  monacoEditor?.executeEdits('', [
    {
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      text
    }
  ]);
  // 设置新的光标位置
  monacoEditor?.setPosition({ ...position, column: position.column + text.length });
  // 重新聚焦
  monacoEditor?.focus();
}

onMounted(() => {
  monacoEditor = monaco.editor.create(editContainer.value as HTMLElement, {
    value: getValue(),
    ...props.config,
    language: props.language,
    readOnly: props.readOnly,
    lineNumbers: props.lineNumbers,
    theme: props.theme,
    scrollBeyondLastLine: false,
    scrollbar: {
      verticalScrollbarSize: 10,
      horizontalScrollbarSize: 10
    },
    automaticLayout: true,
    suggest: {
      preview: true
    }
  });

  // 自动切换主题
  if (props.autoToggleTheme) {
    watch(
      () => themeStore.darkMode,
      () => {
        nextTick(() => handleToggleTheme());
      },
      {
        immediate: true
      }
    );
  }

  // 获取值
  function getValue() {
    // valueFormat 为json 格式，需要转换处理
    if (props.valueFormat === 'json') {
      if (props.modelValue) {
        return JSON.stringify(props.modelValue, null, 2);
      }
    }
    return props.modelValue ?? '';
  }

  // 监听值变化
  monacoEditor.onDidChangeModelContent(() => {
    const currenValue = monacoEditor?.getValue();

    // valueFormat 为json 格式，需要转换处理
    if (props.valueFormat === 'json' && currenValue) {
      emit('update:modelValue', JSON.parse(currenValue));
      return;
    }

    emit('update:modelValue', currenValue ?? '');
  });
});

defineExpose({
  setValue,
  insertText
});
</script>

<template>
  <div ref="editContainer" class="phoenix-code-editor" />
</template>

<style lang="scss" scoped>
.phoenix-code-editor {
  width: 100%;
  min-height: calc(100vh - 120px);
  height: 100%;

  :deep(.monaco-editor) {
    height: 100%;
  }
}
</style>

import { defineConfig } from '@soybeanjs/eslint-config';

export default defineConfig(
  {
    vue: true,
    unocss: true,
    // src/libs/warm-flow-designer 下的构建产物与设计器源码副本，来源见该目录 SOURCE.md，不随本项目规范改动
    ignores: [
      'src/libs/warm-flow-designer/*.es.js',
      'src/libs/warm-flow-designer/warm-flow-designer.css',
      'src/libs/warm-flow-designer/src/**'
    ]
  },
  {
    rules: {
      'vue/multi-word-component-names': [
        'warn',
        {
          ignores: ['index', 'App', 'Register', '[id]', '[url]']
        }
      ],
      'vue/component-name-in-template-casing': [
        'warn',
        'PascalCase',
        {
          registeredComponentsOnly: false,
          ignores: ['/^icon-/']
        }
      ],
      'unocss/order-attributify': 'off'
    }
  }
);

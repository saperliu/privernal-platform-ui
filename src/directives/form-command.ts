import type { App, Directive } from 'vue';

type DataComponent = {
  show: boolean;
  edit: boolean;
  must: boolean;
};

export default function setupFormCommandDirective(app: App) {
  // const { hasShow, hasEdit, hasMust } = useFormCommand();
  function updateElVisible(el: HTMLElement, fieldName: string | undefined, type: DataComponent) {
    if (!type) {
      throw new Error(`need function : like v-form-command="'show'" `);
    }
    if (fieldName === undefined) {
      throw new Error(`need fieldName : like v-form-command:name="'show'" `);
    }
    if (!type.show) {
      el.setAttribute('class', 'field-hidden');
      // el.parentElement?.removeChild(); // 初始化会被移除，然后如果要显示，无法添加回来。
      // el.style.display = 'none'; //vue自行操作，会被自动恢复
    } else {
      el.setAttribute('class', '');
    }
    // if (!type.edit) {
    //   const elInput = el.querySelector('input');
    //   if (elInput !== null) {
    //     elInput.disabled = true;
    //   }
    // } else {
    //   const elInput = el.querySelector('input');
    //   if (elInput !== null) {
    //     elInput.disabled = false;
    //   }
    // }

    // if (type === 'must') {
    //   if (!hasMust(fieldName)) {
    //     /* empty */
    //   }
    // }
  }

  const formCommandDirective: Directive<HTMLElement, DataComponent> = {
    mounted(el, binding) {
      updateElVisible(el, binding.arg, binding.value);
    },
    beforeUpdate(el, binding) {
      updateElVisible(el, binding.arg, binding.value);
    }
  };

  app.directive('form-command', formCommandDirective);
}

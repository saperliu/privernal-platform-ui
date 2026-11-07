import type { App, Plugin } from 'vue';
/** 设置对象数据 */
export function objectAssign<T extends Record<string, any>>(target: T, source: Partial<T>) {
  Object.assign(target, source);
}

export const withInstall = <T>(component: T, alias?: string) => {
  const comp = component as any;
  comp.install = (app: App) => {
    app.component(comp.name || comp.displayName);
    if (alias) {
      app.config.globalProperties[alias] = component;
    }
  };
  return component as T & Plugin;
};

export function objectAssignTarget<T extends Record<string, any>>(target: T, source: Partial<T>) {
  const keyArr = Object.keys(target);
  const mutableTarget: Record<string, any> = target;
  keyArr.forEach(item => {
    mutableTarget[item] = source[item];
  });
}

export function objectAssignList<T extends Record<string, any>>(target: T, source: Partial<T>) {
  const keyArr = Object.keys(target);
  const mutableTarget: Record<string, any> = target;
  const list: any[] = [];
  if (source instanceof Array) {
    source.forEach(sourceObj => {
      const obj: Record<string, any> = {};
      keyArr.forEach(item => {
        obj[item] = sourceObj[item];
      });
      list.push(obj);
    });
  } else {
    keyArr.forEach(item => {
      mutableTarget[item] = source[item];
    });
    list.push(target);
  }

  return list;
}

import { ElLoading as n, ElIcon as a, ElTooltip as E, ElDivider as s, ElPagination as u, ElSwitch as p, ElTimePicker as m, ElDatePicker as d, ElDrawer as g, ElDialog as T, ElRadioGroup as f, ElRadio as b, ElTag as k, ElTree as x, ElTreeSelect as w, ElCheckboxGroup as h, ElCheckbox as B, ElHeader as D, ElRow as v, ElCol as C, ElTableColumn as I, ElTable as y, ElFormItem as O, ElForm as P, ElOption as F, ElSelect as L, ElInputNumber as R, ElInput as S, ElButton as A, ClickOutside as G, ElMessageBox as r, ElNotification as M, ElMessage as N } from "element-plus";
const i = "系统提示";
function c(e) {
  return typeof e == "string" ? { message: e } : { ...e };
}
const U = {
  name: "element-plus",
  message(e, t) {
    N({ ...c(t), type: e });
  },
  notify(e, t) {
    M({ ...c(t), type: e });
  },
  alert(e, t = {}) {
    const { title: o = i, ...l } = t;
    return r.alert(e, o, l);
  },
  confirm(e, t = {}) {
    const { title: o = i, ...l } = t;
    return r.confirm(e, o, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      ...l
    });
  },
  prompt(e, t = {}) {
    const { title: o = i, ...l } = t;
    return r.prompt(e, o, {
      confirmButtonText: "确定",
      cancelButtonText: "取消",
      type: "warning",
      ...l
    });
  },
  loading(e = {}) {
    const t = n.service({ lock: !0, ...e });
    return { close: () => t.close() };
  },
  clickOutside: G,
  // v-loading 指令直接复用 EP 内置实现（区域遮罩），与 antd 自实现遮罩对齐
  loadingDirective: n.directive,
  // 中性组件语义名 -> Element Plus 实现（供 Wf* 透传渲染）
  components: {
    button: A,
    input: S,
    "input-number": R,
    select: L,
    option: F,
    form: P,
    "form-item": O,
    table: y,
    "table-column": I,
    col: C,
    row: v,
    header: D,
    checkbox: B,
    "checkbox-group": h,
    "tree-select": w,
    tree: x,
    tag: k,
    radio: b,
    "radio-group": f,
    dialog: T,
    drawer: g,
    "date-picker": d,
    "time-picker": m,
    switch: p,
    pagination: u,
    divider: s,
    tooltip: E,
    icon: a
  }
};
export {
  U as default,
  U as elementPlusAdapter
};

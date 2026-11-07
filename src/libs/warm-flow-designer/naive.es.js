import { defineComponent as p, h as u, watch as W, ref as P, Fragment as E, createApp as w } from "vue";
import { NButton as U, NInput as V, NSelect as S, NSwitch as F, NRadio as z, NCheckbox as L, NTag as D, NTooltip as M, NForm as R, NFormItem as I, NDataTable as O, NModal as $, NDrawer as G, NDrawerContent as H, NDatePicker as K, NTimePicker as j, NPagination as B, NTree as q, NDivider as Y, NInputNumber as J, NRadioGroup as Q, NCheckboxGroup as X, NTreeSelect as Z, NSpin as k, createDiscreteApi as ee } from "naive-ui";
function te(a) {
  return typeof a == "string" ? a : a.message ?? a.title ?? "";
}
let y = null;
function h() {
  return y || (y = ee(["message", "notification", "dialog"])), y;
}
const ae = {
  mounted(a, o) {
    a.__wfClickOutside__ = (t) => {
      var e;
      a !== t.target && !a.contains(t.target) && ((e = o.value) == null || e.call(o, t));
    }, document.addEventListener("click", a.__wfClickOutside__, !0);
  },
  unmounted(a) {
    document.removeEventListener("click", a.__wfClickOutside__, !0), a.__wfClickOutside__ = null;
  }
};
function N(a, o) {
  if (o) {
    if (a.__wfLoadingApp__)
      return;
    getComputedStyle(a).position === "static" && (a.__wfLoadingPrevPosition__ = a.style.position, a.style.position = "relative");
    const t = document.createElement("div");
    t.style.cssText = "position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.6)", a.appendChild(t);
    const e = w({ render: () => u(k, { size: "large" }) });
    e.mount(t), a.__wfLoadingApp__ = e, a.__wfLoadingEl__ = t;
  } else
    b(a);
}
function b(a) {
  a.__wfLoadingApp__ && (a.__wfLoadingApp__.unmount(), a.__wfLoadingApp__ = null), a.__wfLoadingEl__ && (a.__wfLoadingEl__.remove(), a.__wfLoadingEl__ = null), a.__wfLoadingPrevPosition__ !== void 0 && (a.style.position = a.__wfLoadingPrevPosition__, a.__wfLoadingPrevPosition__ = void 0);
}
const ne = {
  mounted(a, o) {
    N(a, o.value);
  },
  updated(a, o) {
    o.value !== o.oldValue && N(a, o.value);
  },
  unmounted(a) {
    b(a);
  }
};
function x(a, o) {
  const t = [], e = (i) => {
    var n, l;
    if (Array.isArray(i))
      for (const r of i) {
        if (!r || typeof r != "object")
          continue;
        if (r.type === E) {
          e(r.children);
          continue;
        }
        (((n = r.type) == null ? void 0 : n.name) || ((l = r.type) == null ? void 0 : l.__name) || "") === o && t.push(r);
      }
  };
  return e(a), t;
}
const _ = /* @__PURE__ */ new WeakMap();
let oe = 0;
function le(a) {
  if (a && typeof a == "object") {
    let o = _.get(a);
    return o == null && (o = ++oe, _.set(a, o)), o;
  }
  return String(a);
}
function A(a, o) {
  return a ? String(a).replace(/Y/g, "y").replace(/D/g, "d") : o;
}
function g(a, o, t, e) {
  return p({
    name: a,
    inheritAttrs: !1,
    setup(i, { attrs: n, slots: l }) {
      return () => {
        const r = { ...n }, s = r.modelValue, d = r["onUpdate:modelValue"];
        delete r.modelValue, delete r["onUpdate:modelValue"];
        let c = { ...r, [t]: s, [`onUpdate:${t}`]: (f) => d == null ? void 0 : d(f) };
        return e && (c = e(c, r)), u(o, c, l);
      };
    }
  });
}
const ie = p({
  name: "WfNaiveButton",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    const e = { primary: "primary", success: "success", warning: "warning", danger: "error", info: "info" }, i = { large: "large", default: "medium", small: "small" };
    return () => {
      const n = { ...o }, l = n.type, r = n.link, s = n.plain, d = n.size;
      ["type", "link", "plain", "size"].forEach((f) => delete n[f]);
      const c = { ...n };
      return l === "text" || r ? c.text = !0 : l && e[l] ? c.type = e[l] : c.type = "default", s && (c.ghost = !0), d && i[d] && (c.size = i[d]), u(U, c, t);
    };
  }
}), re = p({
  name: "WfNaiveInput",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.modelValue, n = e["onUpdate:modelValue"], l = e.type, r = e.rows;
      ["modelValue", "onUpdate:modelValue", "type", "rows"].forEach((d) => delete e[d]), e.maxlength != null && (e.maxlength = Number(e.maxlength));
      const s = {
        ...e,
        value: i ?? null,
        "onUpdate:value": (d) => n == null ? void 0 : n(d)
      };
      return l === "textarea" ? (s.type = "textarea", r != null && (s.rows = Number(r))) : l && (s.type = l), u(V, s, t);
    };
  }
}), se = g("WfNaiveInputNumber", J, "value", (a) => ((a.value === "" || a.value === void 0) && (a.value = null), a.style = { width: "100%", ...a.style || {} }, a)), ue = p({
  name: "WfNaiveSelect",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.modelValue, n = e["onUpdate:modelValue"], l = e.clearable, r = e.filterable, s = e.multiple;
      ["modelValue", "onUpdate:modelValue", "clearable", "filterable", "multiple"].forEach((f) => delete e[f]);
      const c = x(t.default ? t.default() : [], "WfOption").map((f) => {
        const m = f.props || {};
        return { label: m.label, value: m.value };
      });
      return u(S, {
        ...e,
        value: i ?? null,
        clearable: !!l,
        filterable: !!r,
        multiple: !!s,
        options: c,
        "onUpdate:value": (f) => n == null ? void 0 : n(f)
      });
    };
  }
}), ce = p({
  name: "WfNaiveOption",
  setup() {
    return () => null;
  }
}), de = p({
  name: "WfNaiveSwitch",
  inheritAttrs: !1,
  setup(a, { attrs: o }) {
    const t = o;
    return W(
      () => t.modelValue,
      (e) => {
        const i = t["onUpdate:modelValue"];
        if (!i)
          return;
        const n = t["active-value"] ?? t.activeValue, l = t["inactive-value"] ?? t.inactiveValue, r = n !== void 0 ? n : !0, s = l !== void 0 ? l : !1;
        e !== r && e !== s && i(s);
      },
      { immediate: !0 }
    ), () => {
      const e = { ...o }, i = e.modelValue, n = e["onUpdate:modelValue"], l = e["active-value"] ?? e.activeValue, r = e["inactive-value"] ?? e.inactiveValue, s = e["active-text"] ?? e.activeText, d = e["inactive-text"] ?? e.inactiveText;
      [
        "modelValue",
        "onUpdate:modelValue",
        "active-value",
        "activeValue",
        "inactive-value",
        "inactiveValue",
        "active-text",
        "activeText",
        "inactive-text",
        "inactiveText"
      ].forEach((f) => delete e[f]);
      const c = {};
      return s && (c.checked = () => s), d && (c.unchecked = () => d), u(F, {
        ...e,
        value: i,
        checkedValue: l !== void 0 ? l : !0,
        uncheckedValue: r !== void 0 ? r : !1,
        "onUpdate:value": (f) => n == null ? void 0 : n(f)
      }, c);
    };
  }
}), pe = g("WfNaiveRadioGroup", Q, "value"), fe = p({
  name: "WfNaiveRadio",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.label ?? e.value;
      return delete e.label, u(z, { ...e, value: i }, t);
    };
  }
}), me = g("WfNaiveCheckboxGroup", X, "value"), ve = p({
  name: "WfNaiveCheckbox",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.modelValue, n = e["onUpdate:modelValue"], l = e.label ?? e.value;
      ["modelValue", "onUpdate:modelValue", "label", "value"].forEach((s) => delete e[s]);
      const r = { ...e, value: l };
      return (i !== void 0 || n) && (r.checked = i, r["onUpdate:checked"] = (s) => n == null ? void 0 : n(s)), u(L, r, t);
    };
  }
}), he = g("WfNaiveTreeSelect", Z, "value", (a, o) => {
  o.data != null && (a.options = o.data, delete a.data);
  const t = o.props || {};
  return a.keyField = t.value || o["node-key"] || "id", a.labelField = t.label || "label", a.childrenField = t.children || "children", delete a.props, delete a["node-key"], delete a["value-key"], delete a["check-strictly"], (a.value === "" || a.value == null) && (a.value = null), a.style = { width: "100%", ...o.style || {} }, a;
}), ge = p({
  name: "WfNaiveTag",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    const e = { success: "success", info: "info", warning: "warning", danger: "error", primary: "primary" };
    return () => {
      const i = { ...o }, n = i.type;
      return ["type", "effect"].forEach((l) => delete i[l]), u(D, { ...i, type: n && e[n] || "default" }, t);
    };
  }
}), ye = p({
  name: "WfNaiveTooltip",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.content, n = e["show-after"] ?? e.showAfter;
      return ["content", "show-after", "showAfter"].forEach((l) => delete e[l]), n != null && (e.delay = Number(n)), u(M, e, {
        trigger: () => t.default ? t.default() : [],
        default: () => i ?? (t.content ? t.content() : [])
      });
    };
  }
}), Ne = p({
  name: "WfNaiveForm",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t, expose: e }) {
    const i = P(null);
    return e({
      validate(n) {
        const l = i.value, r = l != null && l.validate ? l.validate() : null;
        return !r || typeof r.then != "function" ? (n == null || n(!0), Promise.resolve(!0)) : r.then(() => (n == null || n(!0), !0)).catch((s) => (n == null || n(!1, s), n ? !1 : Promise.reject(s)));
      },
      // naive 无逐字段 clearValidate(field)，统一 restoreValidation 复位
      clearValidate() {
        var n, l;
        return (l = (n = i.value) == null ? void 0 : n.restoreValidation) == null ? void 0 : l.call(n);
      },
      restoreValidation() {
        var n, l;
        return (l = (n = i.value) == null ? void 0 : n.restoreValidation) == null ? void 0 : l.call(n);
      },
      resetFields() {
        var n, l;
        return (l = (n = i.value) == null ? void 0 : n.restoreValidation) == null ? void 0 : l.call(n);
      }
    }), () => {
      const n = { ...o }, l = n["label-width"] ?? n.labelWidth, r = n.inline === !0 || n.inline === "" || n.inline === "true";
      ["label-width", "labelWidth", "inline"].forEach((d) => delete n[d]);
      const s = {
        ...n,
        ref: i,
        labelPlacement: "left",
        labelAlign: "right",
        inline: r
      };
      return l != null && (s.labelWidth = /^\d+$/.test(String(l)) ? Number(l) : l), u(R, s, t);
    };
  }
}), _e = p({
  name: "WfNaiveFormItem",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.prop, n = e.rules;
      ["prop", "rules"].forEach((r) => delete e[r]);
      const l = { ...e };
      return i != null && (l.path = i), n != null && (l.rule = n), u(I, l, t);
    };
  }
}), we = p({
  name: "WfNaiveTable",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.data, n = e.onRowClick;
      ["data", "empty-text", "emptyText", "onRowClick", "stripe", "border"].forEach((s) => delete e[s]);
      const r = x(t.default ? t.default() : [], "WfNaiveTableColumn").map((s, d) => {
        const c = s.props || {}, f = {
          title: c.label,
          key: c.prop ?? d,
          width: c.width,
          align: c.align
        }, m = s.children, v = m && typeof m == "object" && !Array.isArray(m) ? m.default : null;
        return typeof v == "function" && (f.render = (C, T) => v({ row: C, $index: T, column: f })), f;
      });
      return u(O, {
        ...e,
        data: Array.isArray(i) ? [...i] : [],
        columns: r,
        rowKey: le,
        size: "small",
        ...n ? { rowProps: (s) => ({ style: "cursor:pointer", onClick: () => n(s) }) } : {}
      });
    };
  }
}), Ve = p({
  name: "WfNaiveTableColumn",
  setup() {
    return () => null;
  }
}), ke = p({
  name: "WfNaiveDialog",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = e.modelValue, n = e["onUpdate:modelValue"], l = e.title, r = e.width;
      return ["modelValue", "onUpdate:modelValue", "append-to-body", "destroy-on-close", "before-close", "title", "width"].forEach((s) => delete e[s]), u($, {
        ...e,
        show: i,
        preset: "card",
        title: l,
        style: { width: r ? /^\d+$/.test(String(r)) ? `${r}px` : String(r) : "600px" },
        "onUpdate:show": (s) => n == null ? void 0 : n(s)
      }, { default: t.default, footer: t.footer });
    };
  }
}), be = p({
  name: "WfNaiveDrawer",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    const e = { rtl: "right", ltr: "left", ttb: "top", btt: "bottom" };
    return () => {
      const i = { ...o }, n = i.modelValue, l = i["onUpdate:modelValue"], r = i.direction, s = i.size, d = i.title;
      ["modelValue", "onUpdate:modelValue", "direction", "size", "append-to-body", "before-close", "destroy-on-close", "title"].forEach((v) => delete i[v]);
      const c = r && e[r] || "right", f = c === "top" || c === "bottom" ? "height" : "width", m = s != null ? /^\d+$/.test(String(s)) ? Number(s) : s : 380;
      return u(G, {
        ...i,
        show: n,
        placement: c,
        [f]: m,
        "onUpdate:show": (v) => l == null ? void 0 : l(v)
      }, {
        default: () => u(H, { title: d, closable: !0 }, t)
      });
    };
  }
}), xe = p({
  name: "WfNaiveDatePicker",
  inheritAttrs: !1,
  setup(a, { attrs: o }) {
    return () => {
      const t = { ...o }, e = t.type || "date", i = e.endsWith("range"), n = t.modelValue, l = t["onUpdate:modelValue"], r = t["value-format"] ?? t.valueFormat, s = e === "datetime" || e === "datetimerange";
      [
        "modelValue",
        "onUpdate:modelValue",
        "value-format",
        "valueFormat",
        "range-separator",
        "start-placeholder",
        "end-placeholder"
      ].forEach((c) => delete t[c]);
      let d;
      return i ? d = Array.isArray(n) && n.length === 2 && n[0] && n[1] ? n : null : d = n === "" || n == null ? null : n, u(K, {
        ...t,
        type: e,
        clearable: !0,
        formattedValue: d,
        valueFormat: A(r, s ? "yyyy-MM-dd HH:mm:ss" : "yyyy-MM-dd"),
        "onUpdate:formattedValue": (c) => l == null ? void 0 : l(c)
      });
    };
  }
}), Ae = p({
  name: "WfNaiveTimePicker",
  inheritAttrs: !1,
  setup(a, { attrs: o }) {
    return () => {
      const t = { ...o }, e = t.modelValue, i = t["onUpdate:modelValue"], n = t["value-format"] ?? t.valueFormat;
      return ["modelValue", "onUpdate:modelValue", "value-format", "valueFormat"].forEach((l) => delete t[l]), u(j, {
        ...t,
        clearable: !0,
        formattedValue: e === "" || e == null ? null : e,
        valueFormat: A(n, "HH:mm:ss"),
        "onUpdate:formattedValue": (l) => i == null ? void 0 : i(l)
      });
    };
  }
}), Ce = p({
  name: "WfNaivePagination",
  inheritAttrs: !1,
  setup(a, { attrs: o }) {
    return () => {
      const t = { ...o }, e = t["current-page"] ?? t.currentPage ?? t.modelValue, i = t["onUpdate:current-page"] ?? t["onUpdate:currentPage"], n = t["page-size"] ?? t.pageSize, l = t.total;
      return ["current-page", "currentPage", "modelValue", "onUpdate:current-page", "onUpdate:currentPage", "page-size", "pageSize", "total", "layout"].forEach((r) => delete t[r]), u(B, {
        ...t,
        page: e,
        pageSize: n,
        itemCount: l,
        "onUpdate:page": (r) => i == null ? void 0 : i(r)
      });
    };
  }
}), Te = p({
  name: "WfNaiveTree",
  inheritAttrs: !1,
  setup(a, { attrs: o }) {
    return () => {
      const t = { ...o }, e = t.data, i = t.props || {}, n = t.onNodeClick;
      return ["data", "props", "node-key", "nodeKey", "onNodeClick", "highlight-current", "default-expand-all", "expand-on-click-node"].forEach((l) => delete t[l]), u(q, {
        ...t,
        data: Array.isArray(e) ? e : [],
        keyField: i.value || o["node-key"] || "id",
        labelField: i.label || "label",
        childrenField: i.children || "children",
        blockLine: !0,
        ...n ? {
          nodeProps: (l) => ({ onClick: () => n(l.option) })
        } : {}
      });
    };
  }
}), We = p({
  name: "WfNaiveRow",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = Number(e.gutter ?? 0);
      delete e.gutter;
      const n = { display: "flex", flexWrap: "wrap", ...i ? { gap: `${i}px` } : {}, ...e.style || {} };
      return u("div", { ...e, style: n }, t.default ? t.default() : []);
    };
  }
}), Pe = p({
  name: "WfNaiveCol",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => {
      const e = { ...o }, i = Number(e.span ?? 24);
      ["span", "xs", "sm", "md", "lg", "xl"].forEach((r) => delete e[r]);
      const n = `${Math.min(Math.max(i, 0), 24) / 24 * 100}%`, l = { flex: `0 0 calc(${n} - 0px)`, maxWidth: n, boxSizing: "border-box", ...e.style || {} };
      return u("div", { ...e, style: l }, t.default ? t.default() : []);
    };
  }
}), Ee = p({
  name: "WfNaiveHeader",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => u("header", { ...o }, t.default ? t.default() : []);
  }
}), Ue = p({
  name: "WfNaiveIcon",
  inheritAttrs: !1,
  setup(a, { attrs: o, slots: t }) {
    return () => u("span", { ...o, class: ["wf-icon", o.class] }, t.default ? t.default() : []);
  }
}), ze = {
  name: "naive-ui",
  message(a, o) {
    h().message[a](te(o));
  },
  notify(a, o) {
    const t = typeof o == "string" ? { message: o } : o;
    h().notification[a]({ title: t.title ?? "提示", content: t.message });
  },
  alert(a, o = {}) {
    return new Promise((t) => {
      h().dialog.info({
        title: o.title ?? "系统提示",
        content: a,
        positiveText: "确定",
        onPositiveClick: () => t(!0),
        onClose: () => t(!0)
      });
    });
  },
  confirm(a, o = {}) {
    return new Promise((t, e) => {
      h().dialog.warning({
        title: o.title ?? "系统提示",
        content: a,
        positiveText: "确定",
        negativeText: "取消",
        onPositiveClick: () => t(!0),
        onNegativeClick: () => e(new Error("cancel")),
        onClose: () => e(new Error("cancel"))
      });
    });
  },
  // naive 无内置 prompt：用 dialog + n-input 实现
  prompt(a, o = {}) {
    return new Promise((t, e) => {
      let i = "";
      h().dialog.info({
        title: o.title ?? "系统提示",
        content: () => u("div", [
          typeof a == "string" && a ? u("div", { style: "margin-bottom:8px" }, a) : null,
          u(V, { "onUpdate:value": (n) => {
            i = n;
          } })
        ]),
        positiveText: "确定",
        negativeText: "取消",
        onPositiveClick: () => t({ value: i }),
        onNegativeClick: () => e(new Error("cancel")),
        onClose: () => e(new Error("cancel"))
      });
    });
  },
  // 全屏遮罩 loading（naive 无命令式 Spin service，自建覆盖层）
  loading(a = {}) {
    const o = document.createElement("div");
    o.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)", document.body.appendChild(o);
    const t = w({
      render: () => u("div", { style: "text-align:center" }, [
        u(k, { size: "large" }),
        u("div", { style: "margin-top:12px;color:#fff" }, a.text ?? "加载中...")
      ])
    });
    return t.mount(o), { close: () => {
      t.unmount(), o.remove();
    } };
  },
  clickOutside: ae,
  loadingDirective: ne,
  components: {
    button: ie,
    input: re,
    "input-number": se,
    select: ue,
    option: ce,
    switch: de,
    radio: fe,
    "radio-group": pe,
    checkbox: ve,
    "checkbox-group": me,
    "tree-select": he,
    tree: Te,
    tag: ge,
    tooltip: ye,
    divider: Y,
    col: Pe,
    row: We,
    form: Ne,
    "form-item": _e,
    table: we,
    "table-column": Ve,
    header: Ee,
    dialog: ke,
    drawer: be,
    "date-picker": xe,
    "time-picker": Ae,
    pagination: Ce,
    icon: Ue
  }
};
export {
  ze as default,
  ze as naiveAdapter
};

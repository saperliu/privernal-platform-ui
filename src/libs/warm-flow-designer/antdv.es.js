import { defineComponent as d, h as s, watch as W, ref as P, Fragment as S, createApp as w } from "vue";
import { Button as z, Input as V, Switch as U, RadioGroup as E, Radio as F, Select as R, Tag as L, Tooltip as D, Form as N, FormItem as O, Table as I, Modal as _, Drawer as M, DatePicker as x, Pagination as Y, Col as j, Divider as G, Row as K, InputNumber as $, CheckboxGroup as B, Checkbox as H, TreeSelect as q, TimePicker as J, Tree as Q, Spin as b, notification as X, message as Z } from "ant-design-vue";
function ee(t) {
  return typeof t == "string" ? t : t.message ?? t.title ?? "";
}
const te = {
  mounted(t, o) {
    t.__wfClickOutside__ = (n) => {
      var e;
      t !== n.target && !t.contains(n.target) && ((e = o.value) == null || e.call(o, n));
    }, document.addEventListener("click", t.__wfClickOutside__, !0);
  },
  unmounted(t) {
    document.removeEventListener("click", t.__wfClickOutside__, !0), t.__wfClickOutside__ = null;
  }
};
function A(t, o) {
  if (o) {
    if (t.__wfLoadingApp__)
      return;
    getComputedStyle(t).position === "static" && (t.__wfLoadingPrevPosition__ = t.style.position, t.style.position = "relative");
    const n = document.createElement("div");
    n.style.cssText = "position:absolute;inset:0;z-index:10;display:flex;align-items:center;justify-content:center;background:rgba(255,255,255,0.6)", t.appendChild(n);
    const e = w({ render: () => s(b, { size: "large" }) });
    e.mount(n), t.__wfLoadingApp__ = e, t.__wfLoadingEl__ = n;
  } else
    C(t);
}
function C(t) {
  t.__wfLoadingApp__ && (t.__wfLoadingApp__.unmount(), t.__wfLoadingApp__ = null), t.__wfLoadingEl__ && (t.__wfLoadingEl__.remove(), t.__wfLoadingEl__ = null), t.__wfLoadingPrevPosition__ !== void 0 && (t.style.position = t.__wfLoadingPrevPosition__, t.__wfLoadingPrevPosition__ = void 0);
}
const ne = {
  mounted(t, o) {
    A(t, o.value);
  },
  updated(t, o) {
    o.value !== o.oldValue && A(t, o.value);
  },
  unmounted(t) {
    C(t);
  }
}, oe = d({
  name: "WfAntButton",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.type;
      delete e.type, delete e.link, delete e.plain;
      const a = { ...e };
      return o.link ? a.type = "link" : r === "primary" ? a.type = "primary" : r === "text" ? a.type = "text" : r === "danger" ? a.danger = !0 : r === "warning" || r === "success" || r === "info" ? a.type = "default" : a.type = a.type || "default", o.size === "default" && (a.size = "middle"), s(z, a, n);
    };
  }
}), ae = d({
  name: "WfAntInput",
  inheritAttrs: !1,
  setup(t, { attrs: o }) {
    return () => {
      const n = { ...o }, e = n.modelValue, r = n["onUpdate:modelValue"], a = n.clearable;
      return delete n.modelValue, delete n["onUpdate:modelValue"], delete n.clearable, n.maxlength != null && (n.maxlength = Number(n.maxlength)), s(V, {
        ...n,
        value: e,
        allowClear: a,
        "onUpdate:value": (l) => r == null ? void 0 : r(l)
      });
    };
  }
}), le = d({
  name: "WfAntSwitch",
  inheritAttrs: !1,
  setup(t, { attrs: o }) {
    const n = o;
    return W(
      () => n.modelValue,
      (e) => {
        const r = n["onUpdate:modelValue"];
        if (!r)
          return;
        const a = n["active-value"] ?? n.activeValue, l = n["inactive-value"] ?? n.inactiveValue, i = a !== void 0 ? a : !0, c = l !== void 0 ? l : !1;
        e !== i && e !== c && r(c);
      },
      { immediate: !0 }
    ), () => {
      const e = { ...o }, r = e.modelValue, a = e["onUpdate:modelValue"], l = e["active-value"] ?? e.activeValue, i = e["inactive-value"] ?? e.inactiveValue, c = e["active-text"] ?? e.activeText, u = e["inactive-text"] ?? e.inactiveText;
      return [
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
      ].forEach((p) => delete e[p]), (e.size === "large" || e.size === "default") && delete e.size, s(U, {
        ...e,
        checked: r,
        checkedValue: l,
        unCheckedValue: i,
        checkedChildren: c,
        unCheckedChildren: u,
        "onUpdate:checked": (p) => a == null ? void 0 : a(p)
      });
    };
  }
}), re = d({
  name: "WfAntRadioGroup",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.modelValue, a = e["onUpdate:modelValue"];
      return delete e.modelValue, delete e["onUpdate:modelValue"], s(E, { ...e, value: r, "onUpdate:value": (l) => a == null ? void 0 : a(l) }, n);
    };
  }
}), ie = d({
  name: "WfAntRadio",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.label ?? e.value;
      return delete e.label, s(F, { ...e, value: r }, n);
    };
  }
}), se = d({
  name: "WfAntSelect",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.modelValue, a = e["onUpdate:modelValue"], l = e.clearable, i = e.filterable, c = e["allow-create"] ?? e.allowCreate;
      ["modelValue", "onUpdate:modelValue", "clearable", "filterable", "allow-create", "allowCreate"].forEach((f) => delete e[f]);
      const p = T(n.default ? n.default() : [], "WfOption").map((f) => {
        const m = f.props || {};
        return { label: m.label, value: m.value };
      });
      return s(R, {
        ...e,
        value: r,
        allowClear: l,
        showSearch: !!(i || c),
        mode: c ? "tags" : void 0,
        options: p,
        style: { width: "100%", ...e.style || {} },
        "onUpdate:value": (f) => a == null ? void 0 : a(f)
      });
    };
  }
}), ce = d({
  name: "WfAntOption",
  setup() {
    return () => null;
  }
});
function g(t, o, n, e) {
  return d({
    name: t,
    inheritAttrs: !1,
    setup(r, { attrs: a, slots: l }) {
      return () => {
        const i = { ...a }, c = i.modelValue, u = i["onUpdate:modelValue"];
        delete i.modelValue, delete i["onUpdate:modelValue"];
        let p = { ...i, [n]: c, [`onUpdate:${n}`]: (f) => u == null ? void 0 : u(f) };
        return e && (p = e(p, i)), s(o, p, l);
      };
    }
  });
}
const ue = g("WfAntInputNumber", $, "value"), de = g("WfAntCheckboxGroup", B, "value"), pe = g("WfAntCheckbox", H, "checked", (t, o) => (o.label != null && (t.value = o.label, delete t.label), t)), fe = g("WfAntTreeSelect", q, "value", (t, o) => (o.data != null && (t.treeData = o.data, delete t.data), o.props != null && (t.fieldNames = o.props, delete t.props), o["check-strictly"] != null && (t.treeCheckStrictly = o["check-strictly"], delete t["check-strictly"]), delete t["value-key"], (t.value === "" || t.value == null) && (t.value = void 0), t.style = { width: "100%", ...o.style || {} }, t)), me = d({
  name: "WfAntTag",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    const e = { success: "success", info: "default", warning: "warning", danger: "error", primary: "processing" };
    return () => {
      const r = { ...o }, a = r.type;
      return delete r.type, s(L, { ...r, color: a ? e[a] || a : void 0 }, n);
    };
  }
}), ve = d({
  name: "WfAntTooltip",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      var a;
      const e = { ...o }, r = e.content;
      return delete e.content, s(D, { ...e, title: r ?? ((a = n.content) == null ? void 0 : a.call(n)) }, { default: n.default });
    };
  }
}), he = d({
  name: "WfAntForm",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n, expose: e }) {
    const r = P(null);
    return e({
      // el 的 validate(cb) -> a-form 的 validate()/validateFields() Promise
      validate(a) {
        var c;
        const l = r.value, i = l != null && l.validate ? l.validate() : (c = l == null ? void 0 : l.validateFields) == null ? void 0 : c.call(l);
        return !i || typeof i.then != "function" ? (a == null || a(!0), Promise.resolve(!0)) : i.then(() => (a == null || a(!0), !0)).catch((u) => (a == null || a(!1), a ? !1 : Promise.reject(u)));
      },
      validateField(...a) {
        var l, i;
        return (i = (l = r.value) == null ? void 0 : l.validateFields) == null ? void 0 : i.call(l, ...a);
      },
      clearValidate(a) {
        var l, i;
        return (i = (l = r.value) == null ? void 0 : l.clearValidate) == null ? void 0 : i.call(l, a);
      },
      resetFields(...a) {
        var l, i;
        return (i = (l = r.value) == null ? void 0 : l.resetFields) == null ? void 0 : i.call(l, ...a);
      },
      scrollToField(...a) {
        var l, i;
        return (i = (l = r.value) == null ? void 0 : l.scrollToField) == null ? void 0 : i.call(l, ...a);
      }
    }), () => {
      const a = { ...o }, l = a["label-width"] ?? a.labelWidth, i = a.inline === !0 || a.inline === "" || a.inline === "true";
      delete a["label-width"], delete a.labelWidth, delete a.inline;
      const c = { ...a, ref: r, layout: i ? "inline" : "horizontal" };
      if (l != null) {
        const u = /^\d+$/.test(String(l)) ? `${l}px` : String(l);
        c.labelCol = { style: { width: u, textAlign: "right" } };
      }
      return s(N, c, n);
    };
  }
}), ge = d({
  name: "WfAntFormItem",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.prop;
      delete e.prop;
      let a = r;
      return typeof r == "string" && r.includes(".") && (a = r.split(".").map((l) => /^\d+$/.test(l) ? Number(l) : l)), s(O, { ...e, name: a }, n);
    };
  }
}), k = /* @__PURE__ */ new WeakMap();
let _e = 0;
function ye(t) {
  if (t && typeof t == "object") {
    let o = k.get(t);
    return o == null && (o = ++_e, k.set(t, o)), o;
  }
  return String(t);
}
function T(t, o) {
  const n = [], e = (r) => {
    var a, l;
    if (Array.isArray(r))
      for (const i of r) {
        if (!i || typeof i != "object")
          continue;
        if (i.type === S) {
          e(i.children);
          continue;
        }
        (((a = i.type) == null ? void 0 : a.name) || ((l = i.type) == null ? void 0 : l.__name) || "") === o && n.push(i);
      }
  };
  return e(t), n;
}
const Ae = d({
  name: "WfAntTable",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.data, a = e["empty-text"] ?? e.emptyText, l = e.onRowClick;
      ["data", "empty-text", "emptyText", "onRowClick"].forEach((u) => delete e[u]);
      const c = T(n.default ? n.default() : [], "WfTableColumn").map((u, p) => {
        const f = u.props || {}, m = {
          title: f.label,
          dataIndex: f.prop,
          key: f.prop ?? p,
          width: f.width,
          align: f.align
        }, v = u.children, h = v && typeof v == "object" && !Array.isArray(v) ? v.default : null;
        return typeof h == "function" && (m.customRender = (y) => h({ row: y.record, $index: y.index, column: m, ...y })), m;
      });
      return s(I, {
        ...e,
        // 浅拷贝：既追踪数组响应（迭代）又给 a-table 新引用，确保 push/删除后及时更新
        dataSource: Array.isArray(r) ? [...r] : [],
        columns: c,
        rowKey: ye,
        pagination: !1,
        size: "small",
        ...l ? { customRow: (u) => ({ onClick: () => l(u) }) } : {},
        locale: a ? { emptyText: a } : void 0
      });
    };
  }
}), ke = d({
  name: "WfAntTableColumn",
  setup() {
    return () => null;
  }
}), we = d({
  name: "WfAntDialog",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.modelValue, a = e["onUpdate:modelValue"];
      return ["modelValue", "onUpdate:modelValue", "append-to-body", "destroy-on-close", "before-close"].forEach((l) => delete e[l]), s(_, {
        ...e,
        open: r,
        destroyOnClose: !0,
        footer: n.footer ? void 0 : null,
        "onUpdate:open": (l) => a == null ? void 0 : a(l)
      }, { default: n.default, footer: n.footer, title: n.title });
    };
  }
}), Ve = d({
  name: "WfAntDrawer",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    const e = { rtl: "right", ltr: "left", ttb: "top", btt: "bottom" };
    return () => {
      const r = { ...o }, a = r.modelValue, l = r["onUpdate:modelValue"], i = r.direction, c = r.size, u = r["before-close"];
      ["modelValue", "onUpdate:modelValue", "direction", "size", "append-to-body", "before-close", "destroy-on-close"].forEach((m) => delete r[m]);
      const p = i && e[i] || "right";
      return s(M, {
        ...r,
        open: a,
        placement: p,
        [p === "top" || p === "bottom" ? "height" : "width"]: c,
        destroyOnClose: !0,
        "onUpdate:open": (m) => l == null ? void 0 : l(m),
        onClose: () => {
          u ? u() : l == null || l(!1);
        }
      }, n);
    };
  }
}), xe = x.RangePicker, be = d({
  name: "WfAntDatePicker",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o }, r = e.type || "date", a = r === "daterange" || r === "datetimerange" || r === "monthrange", l = r === "datetime" || r === "datetimerange", i = e.modelValue, c = e["onUpdate:modelValue"], u = e["value-format"] ?? e.valueFormat, p = e["start-placeholder"], f = e["end-placeholder"];
      [
        "modelValue",
        "onUpdate:modelValue",
        "type",
        "value-format",
        "valueFormat",
        "range-separator",
        "start-placeholder",
        "end-placeholder"
      ].forEach((h) => delete e[h]);
      let m;
      a ? m = Array.isArray(i) && i.length === 2 && i[0] && i[1] ? i : void 0 : m = i === "" || i == null ? void 0 : i;
      const v = {
        ...e,
        value: m,
        valueFormat: u || (l ? "YYYY-MM-DD HH:mm:ss" : "YYYY-MM-DD"),
        "onUpdate:value": (h) => c == null ? void 0 : c(h)
      };
      return l && (v.showTime = !0), a && (p || f) && (v.placeholder = [p, f]), s(a ? xe : x, v, n);
    };
  }
}), Ce = g("WfAntTimePicker", J, "value"), Te = g("WfAntTree", Q, "checkedKeys", (t, o) => {
  o.data != null && (t.treeData = o.data, delete t.data);
  const n = o.props || {};
  t.fieldNames = {
    title: n.label || "label",
    key: o["node-key"] || n.value || "key",
    children: n.children || "children"
  };
  const e = t.onNodeClick;
  return e && (t.onSelect = (r, a) => {
    const l = a && a.node || {};
    e(l.dataRef || l);
  }, delete t.onNodeClick), delete t.props, delete t["node-key"], t;
}), We = d({
  name: "WfAntPagination",
  inheritAttrs: !1,
  setup(t, { attrs: o }) {
    return () => {
      const n = { ...o }, e = n["current-page"] ?? n.currentPage ?? n.modelValue, r = n["onUpdate:current-page"] ?? n["onUpdate:currentPage"], a = n["page-size"] ?? n.pageSize;
      return ["current-page", "currentPage", "modelValue", "onUpdate:current-page", "onUpdate:currentPage", "page-size", "pageSize", "layout"].forEach((l) => delete n[l]), s(Y, {
        ...n,
        current: e,
        pageSize: a,
        "onUpdate:current": (l) => r == null ? void 0 : r(l)
      });
    };
  }
}), Pe = d({
  name: "WfAntCol",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => {
      const e = { ...o };
      return ["xs", "sm", "md", "lg", "xl"].some((a) => e[a] != null) && e.span != null && e.md == null && (e.md = e.span, delete e.span), s(j, e, n);
    };
  }
}), Se = d({
  name: "WfAntHeader",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => s("header", { ...o }, n.default ? n.default() : []);
  }
}), ze = d({
  name: "WfAntIcon",
  inheritAttrs: !1,
  setup(t, { attrs: o, slots: n }) {
    return () => s("span", { ...o, class: ["wf-icon", o.class] }, n.default ? n.default() : []);
  }
}), Fe = {
  name: "ant-design-vue",
  message(t, o) {
    Z[t](ee(o));
  },
  notify(t, o) {
    const n = typeof o == "string" ? { message: o } : o;
    X[t]({ message: n.title ?? "提示", description: n.message });
  },
  alert(t, o = {}) {
    return new Promise((n) => {
      _.info({ title: o.title ?? "系统提示", content: t, onOk: () => n(!0) });
    });
  },
  confirm(t, o = {}) {
    return new Promise((n, e) => {
      _.confirm({
        title: o.title ?? "系统提示",
        content: t,
        okText: "确定",
        cancelText: "取消",
        onOk: () => n(!0),
        onCancel: () => e(new Error("cancel"))
      });
    });
  },
  // antd 无内置 prompt：用 Modal.confirm + a-input 实现
  prompt(t, o = {}) {
    return new Promise((n, e) => {
      let r = "";
      _.confirm({
        title: o.title ?? "系统提示",
        content: s("div", [
          typeof t == "string" && t ? s("div", { style: "margin-bottom:8px" }, t) : null,
          s(V, { "onUpdate:value": (a) => {
            r = a;
          } })
        ]),
        okText: "确定",
        cancelText: "取消",
        onOk: () => n({ value: r }),
        onCancel: () => e(new Error("cancel"))
      });
    });
  },
  // 全屏遮罩 loading（antd 无命令式 Spin service，自建覆盖层）
  loading(t = {}) {
    const o = document.createElement("div");
    o.style.cssText = "position:fixed;inset:0;z-index:9999;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,0.45)", document.body.appendChild(o);
    const n = w({
      render: () => s("div", { style: "text-align:center" }, [
        s(b, { size: "large" }),
        s("div", { style: "margin-top:12px;color:#fff" }, t.text ?? "加载中...")
      ])
    });
    return n.mount(o), { close: () => {
      n.unmount(), o.remove();
    } };
  },
  clickOutside: te,
  loadingDirective: ne,
  components: {
    // 已翻译为 antd
    button: oe,
    input: ae,
    switch: le,
    radio: ie,
    "radio-group": re,
    select: se,
    option: ce,
    "input-number": ue,
    checkbox: pe,
    "checkbox-group": de,
    "tree-select": fe,
    tag: me,
    tooltip: ve,
    col: Pe,
    row: K,
    divider: G,
    form: he,
    "form-item": ge,
    table: Ae,
    "table-column": ke,
    header: Se,
    tree: Te,
    dialog: we,
    drawer: Ve,
    "date-picker": be,
    "time-picker": Ce,
    pagination: We,
    icon: ze
  }
};
export {
  Fe as antdvAdapter,
  Fe as default
};

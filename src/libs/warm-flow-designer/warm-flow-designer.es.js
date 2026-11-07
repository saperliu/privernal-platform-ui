var sl = Object.defineProperty;
var al = (e, t, o) => t in e ? sl(e, t, { enumerable: !0, configurable: !0, writable: !0, value: o }) : e[t] = o;
var Ze = (e, t, o) => (al(e, typeof t != "symbol" ? t + "" : t, o), o);
import { defineComponent as be, ref as D, shallowRef as il, onMounted as Uo, watch as de, onUnmounted as Wt, h as Ut, nextTick as et, computed as le, getCurrentInstance as tt, resolveComponent as L, openBlock as _, createElementBlock as V, createElementVNode as v, Fragment as ve, renderList as ye, normalizeClass as _e, toDisplayString as A, withDirectives as ke, createVNode as h, withCtx as g, renderSlot as me, unref as c, vShow as Ne, createBlock as Y, createCommentVNode as j, createTextVNode as Se, reactive as zo, toRefs as dl, Transition as ar, pushScopeId as ot, popScopeId as nt, withKeys as vn, resolveDirective as ir, isRef as ro, withModifiers as dr, normalizeStyle as He, resolveDynamicComponent as ul, createSlots as Dt, normalizeProps as ut, guardReactiveProps as ct, vModelText as cl, createApp as fl } from "vue";
import { defineStore as pl } from "pinia";
import lt, { CircleNode as qo, h as C, CircleNodeModel as jo, RectNode as ur, RectNodeModel as cr, PolygonNodeModel as Ho, PolygonNode as Wo, PolylineEdge as hl, PolylineEdgeModel as ml, HtmlNodeModel as vl, HtmlNode as gl } from "@logicflow/core";
import { CurvedEdgeModel as wl, CurvedEdge as yl, getCurvedEdgePath as bl, InsertNodeInPolyline as _l, Menu as kl, Snapshot as xl } from "@logicflow/extension";
const fr = /^[a-z0-9]+(-[a-z0-9]+)*$/, Gt = (e, t, o, r = "") => {
  const n = e.split(":");
  if (e.slice(0, 1) === "@") {
    if (n.length < 2 || n.length > 3)
      return null;
    r = n.shift().slice(1);
  }
  if (n.length > 3 || !n.length)
    return null;
  if (n.length > 1) {
    const d = n.pop(), a = n.pop(), i = {
      provider: n.length > 0 ? n[0] : r,
      prefix: a,
      name: d
    };
    return t && !Vt(i) ? null : i;
  }
  const l = n[0], s = l.split("-");
  if (s.length > 1) {
    const d = {
      provider: r,
      prefix: s.shift(),
      name: s.join("-")
    };
    return t && !Vt(d) ? null : d;
  }
  if (o && r === "") {
    const d = {
      provider: r,
      prefix: "",
      name: l
    };
    return t && !Vt(d, o) ? null : d;
  }
  return null;
}, Vt = (e, t) => e ? !!((t && e.prefix === "" || e.prefix) && e.name) : !1;
function Cl(e, t) {
  const o = e.icons, r = e.aliases || /* @__PURE__ */ Object.create(null), n = /* @__PURE__ */ Object.create(null);
  function l(s) {
    if (o[s])
      return n[s] = [];
    if (!(s in n)) {
      n[s] = null;
      const d = r[s] && r[s].parent, a = d && l(d);
      a && (n[s] = [d].concat(a));
    }
    return n[s];
  }
  return Object.keys(o).concat(Object.keys(r)).forEach(l), n;
}
const pr = Object.freeze({
  left: 0,
  top: 0,
  width: 16,
  height: 16
}), zt = Object.freeze({
  rotate: 0,
  vFlip: !1,
  hFlip: !1
}), Jt = Object.freeze({
  ...pr,
  ...zt
}), Lo = Object.freeze({
  ...Jt,
  body: "",
  hidden: !1
});
function Sl(e, t) {
  const o = {};
  !e.hFlip != !t.hFlip && (o.hFlip = !0), !e.vFlip != !t.vFlip && (o.vFlip = !0);
  const r = ((e.rotate || 0) + (t.rotate || 0)) % 4;
  return r && (o.rotate = r), o;
}
function gn(e, t) {
  const o = Sl(e, t);
  for (const r in Lo)
    r in zt ? r in e && !(r in o) && (o[r] = zt[r]) : r in t ? o[r] = t[r] : r in e && (o[r] = e[r]);
  return o;
}
function Nl(e, t, o) {
  const r = e.icons, n = e.aliases || /* @__PURE__ */ Object.create(null);
  let l = {};
  function s(d) {
    l = gn(r[d] || n[d], l);
  }
  return s(t), o.forEach(s), gn(e, l);
}
function hr(e, t) {
  const o = [];
  if (typeof e != "object" || typeof e.icons != "object")
    return o;
  e.not_found instanceof Array && e.not_found.forEach((n) => {
    t(n, null), o.push(n);
  });
  const r = Cl(e);
  for (const n in r) {
    const l = r[n];
    l && (t(n, Nl(e, n, l)), o.push(n));
  }
  return o;
}
const Il = {
  provider: "",
  aliases: {},
  not_found: {},
  ...pr
};
function lo(e, t) {
  for (const o in t)
    if (o in e && typeof e[o] != typeof t[o])
      return !1;
  return !0;
}
function mr(e) {
  if (typeof e != "object" || e === null)
    return null;
  const t = e;
  if (typeof t.prefix != "string" || !e.icons || typeof e.icons != "object" || !lo(e, Il))
    return null;
  const o = t.icons;
  for (const n in o) {
    const l = o[n];
    if (!n || typeof l.body != "string" || !lo(l, Lo))
      return null;
  }
  const r = t.aliases || /* @__PURE__ */ Object.create(null);
  for (const n in r) {
    const l = r[n], s = l.parent;
    if (!n || typeof s != "string" || !o[s] && !r[s] || !lo(l, Lo))
      return null;
  }
  return t;
}
const wn = /* @__PURE__ */ Object.create(null);
function El(e, t) {
  return {
    provider: e,
    prefix: t,
    icons: /* @__PURE__ */ Object.create(null),
    missing: /* @__PURE__ */ new Set()
  };
}
function pt(e, t) {
  const o = wn[e] || (wn[e] = /* @__PURE__ */ Object.create(null));
  return o[t] || (o[t] = El(e, t));
}
function vr(e, t) {
  return mr(t) ? hr(t, (o, r) => {
    r ? e.icons[o] = r : e.missing.add(o);
  }) : [];
}
function Tl(e, t, o) {
  try {
    if (typeof o.body == "string")
      return e.icons[t] = { ...o }, !0;
  } catch {
  }
  return !1;
}
let Et = !1;
function gr(e) {
  return typeof e == "boolean" && (Et = e), Et;
}
function Pl(e) {
  const t = typeof e == "string" ? Gt(e, !0, Et) : e;
  if (t) {
    const o = pt(t.provider, t.prefix), r = t.name;
    return o.icons[r] || (o.missing.has(r) ? null : void 0);
  }
}
function $l(e, t) {
  const o = Gt(e, !0, Et);
  if (!o)
    return !1;
  const r = pt(o.provider, o.prefix);
  return t ? Tl(r, o.name, t) : (r.missing.add(o.name), !0);
}
function Go(e, t) {
  if (typeof e != "object")
    return !1;
  if (typeof t != "string" && (t = e.provider || ""), Et && !t && !e.prefix) {
    let r = !1;
    return mr(e) && (e.prefix = "", hr(e, (n, l) => {
      $l(n, l) && (r = !0);
    })), r;
  }
  const o = e.prefix;
  return Vt({
    prefix: o,
    name: "a"
  }) ? !!vr(pt(t, o), e) : !1;
}
const wr = Object.freeze({
  width: null,
  height: null
}), yr = Object.freeze({
  ...wr,
  ...zt
}), Ll = /(-?[0-9.]*[0-9]+[0-9.]*)/g, Rl = /^-?[0-9.]*[0-9]+[0-9.]*$/g;
function yn(e, t, o) {
  if (t === 1)
    return e;
  if (o = o || 100, typeof e == "number")
    return Math.ceil(e * t * o) / o;
  if (typeof e != "string")
    return e;
  const r = e.split(Ll);
  if (r === null || !r.length)
    return e;
  const n = [];
  let l = r.shift(), s = Rl.test(l);
  for (; ; ) {
    if (s) {
      const d = parseFloat(l);
      isNaN(d) ? n.push(l) : n.push(Math.ceil(d * t * o) / o);
    } else
      n.push(l);
    if (l = r.shift(), l === void 0)
      return n.join("");
    s = !s;
  }
}
function Dl(e, t = "defs") {
  let o = "";
  const r = e.indexOf("<" + t);
  for (; r >= 0; ) {
    const n = e.indexOf(">", r), l = e.indexOf("</" + t);
    if (n === -1 || l === -1)
      break;
    const s = e.indexOf(">", l);
    if (s === -1)
      break;
    o += e.slice(n + 1, l).trim(), e = e.slice(0, r).trim() + e.slice(s + 1);
  }
  return {
    defs: o,
    content: e
  };
}
function Vl(e, t) {
  return e ? "<defs>" + e + "</defs>" + t : t;
}
function Ml(e, t, o) {
  const r = Dl(e);
  return Vl(r.defs, t + r.content + o);
}
const Ol = (e) => e === "unset" || e === "undefined" || e === "none";
function Fl(e, t) {
  const o = {
    ...Jt,
    ...e
  }, r = {
    ...yr,
    ...t
  }, n = {
    left: o.left,
    top: o.top,
    width: o.width,
    height: o.height
  };
  let l = o.body;
  [o, r].forEach((w) => {
    const k = [], F = w.hFlip, m = w.vFlip;
    let T = w.rotate;
    F ? m ? T += 2 : (k.push("translate(" + (n.width + n.left).toString() + " " + (0 - n.top).toString() + ")"), k.push("scale(-1 1)"), n.top = n.left = 0) : m && (k.push("translate(" + (0 - n.left).toString() + " " + (n.height + n.top).toString() + ")"), k.push("scale(1 -1)"), n.top = n.left = 0);
    let O;
    switch (T < 0 && (T -= Math.floor(T / 4) * 4), T = T % 4, T) {
      case 1:
        O = n.height / 2 + n.top, k.unshift("rotate(90 " + O.toString() + " " + O.toString() + ")");
        break;
      case 2:
        k.unshift("rotate(180 " + (n.width / 2 + n.left).toString() + " " + (n.height / 2 + n.top).toString() + ")");
        break;
      case 3:
        O = n.width / 2 + n.left, k.unshift("rotate(-90 " + O.toString() + " " + O.toString() + ")");
        break;
    }
    T % 2 === 1 && (n.left !== n.top && (O = n.left, n.left = n.top, n.top = O), n.width !== n.height && (O = n.width, n.width = n.height, n.height = O)), k.length && (l = Ml(l, '<g transform="' + k.join(" ") + '">', "</g>"));
  });
  const s = r.width, d = r.height, a = n.width, i = n.height;
  let u, f;
  s === null ? (f = d === null ? "1em" : d === "auto" ? i : d, u = yn(f, a / i)) : (u = s === "auto" ? a : s, f = d === null ? yn(u, i / a) : d === "auto" ? i : d);
  const p = {}, b = (w, k) => {
    Ol(k) || (p[w] = k.toString());
  };
  b("width", u), b("height", f);
  const y = [
    n.left,
    n.top,
    a,
    i
  ];
  return p.viewBox = y.join(" "), {
    attributes: p,
    viewBox: y,
    body: l
  };
}
const Al = /\sid="(\S+)"/g, bn = /* @__PURE__ */ new Map();
function Bl(e) {
  e = e.replace(/[0-9]+$/, "") || "a";
  const t = bn.get(e) || 0;
  return bn.set(e, t + 1), t ? `${e}${t}` : e;
}
function Ul(e) {
  const t = [];
  let o;
  for (; o = Al.exec(e); )
    t.push(o[1]);
  if (!t.length)
    return e;
  const r = "suffix" + (Math.random() * 16777216 | Date.now()).toString(16);
  return t.forEach((n) => {
    const l = Bl(n), s = n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    e = e.replace(new RegExp('([#;"])(' + s + ')([")]|\\.[a-z])', "g"), "$1" + l + r + "$3");
  }), e = e.replace(new RegExp(r, "g"), ""), e;
}
const Ro = /* @__PURE__ */ Object.create(null);
function zl(e, t) {
  Ro[e] = t;
}
function Do(e) {
  return Ro[e] || Ro[""];
}
function Jo(e) {
  let t;
  if (typeof e.resources == "string")
    t = [e.resources];
  else if (t = e.resources, !(t instanceof Array) || !t.length)
    return null;
  return {
    resources: t,
    path: e.path || "/",
    maxURL: e.maxURL || 500,
    rotate: e.rotate || 750,
    timeout: e.timeout || 5e3,
    random: e.random === !0,
    index: e.index || 0,
    dataAfterTimeout: e.dataAfterTimeout !== !1
  };
}
const Yo = /* @__PURE__ */ Object.create(null), Ct = ["https://api.simplesvg.com", "https://api.unisvg.com"], Mt = [];
for (; Ct.length > 0; )
  Ct.length === 1 || Math.random() > 0.5 ? Mt.push(Ct.shift()) : Mt.push(Ct.pop());
Yo[""] = Jo({ resources: ["https://api.iconify.design"].concat(Mt) });
function ql(e, t) {
  const o = Jo(t);
  return o === null ? !1 : (Yo[e] = o, !0);
}
function Ko(e) {
  return Yo[e];
}
const jl = () => {
  let e;
  try {
    if (e = fetch, typeof e == "function")
      return e;
  } catch {
  }
};
let _n = jl();
function Hl(e, t) {
  const o = Ko(e);
  if (!o)
    return 0;
  let r;
  if (!o.maxURL)
    r = 0;
  else {
    let n = 0;
    o.resources.forEach((s) => {
      n = Math.max(n, s.length);
    });
    const l = t + ".json?icons=";
    r = o.maxURL - n - o.path.length - l.length;
  }
  return r;
}
function Wl(e) {
  return e === 404;
}
const Gl = (e, t, o) => {
  const r = [], n = Hl(e, t), l = "icons";
  let s = {
    type: l,
    provider: e,
    prefix: t,
    icons: []
  }, d = 0;
  return o.forEach((a, i) => {
    d += a.length + 1, d >= n && i > 0 && (r.push(s), s = {
      type: l,
      provider: e,
      prefix: t,
      icons: []
    }, d = a.length), s.icons.push(a);
  }), r.push(s), r;
};
function Jl(e) {
  if (typeof e == "string") {
    const t = Ko(e);
    if (t)
      return t.path;
  }
  return "/";
}
const Yl = (e, t, o) => {
  if (!_n) {
    o("abort", 424);
    return;
  }
  let r = Jl(t.provider);
  switch (t.type) {
    case "icons": {
      const l = t.prefix, s = t.icons.join(","), d = new URLSearchParams({ icons: s });
      r += l + ".json?" + d.toString();
      break;
    }
    case "custom": {
      const l = t.uri;
      r += l.slice(0, 1) === "/" ? l.slice(1) : l;
      break;
    }
    default:
      o("abort", 400);
      return;
  }
  let n = 503;
  _n(e + r).then((l) => {
    const s = l.status;
    if (s !== 200) {
      setTimeout(() => {
        o(Wl(s) ? "abort" : "next", s);
      });
      return;
    }
    return n = 501, l.json();
  }).then((l) => {
    if (typeof l != "object" || l === null) {
      setTimeout(() => {
        l === 404 ? o("abort", l) : o("next", n);
      });
      return;
    }
    setTimeout(() => {
      o("success", l);
    });
  }).catch(() => {
    o("next", n);
  });
}, Kl = {
  prepare: Gl,
  send: Yl
};
function br(e, t) {
  e.forEach((o) => {
    const r = o.loaderCallbacks;
    r && (o.loaderCallbacks = r.filter((n) => n.id !== t));
  });
}
function Xl(e) {
  e.pendingCallbacksFlag || (e.pendingCallbacksFlag = !0, setTimeout(() => {
    e.pendingCallbacksFlag = !1;
    const t = e.loaderCallbacks ? e.loaderCallbacks.slice(0) : [];
    if (!t.length)
      return;
    let o = !1;
    const r = e.provider, n = e.prefix;
    t.forEach((l) => {
      const s = l.icons, d = s.pending.length;
      s.pending = s.pending.filter((a) => {
        if (a.prefix !== n)
          return !0;
        const i = a.name;
        if (e.icons[i])
          s.loaded.push({
            provider: r,
            prefix: n,
            name: i
          });
        else if (e.missing.has(i))
          s.missing.push({
            provider: r,
            prefix: n,
            name: i
          });
        else
          return o = !0, !0;
        return !1;
      }), s.pending.length !== d && (o || br([e], l.id), l.callback(s.loaded.slice(0), s.missing.slice(0), s.pending.slice(0), l.abort));
    });
  }));
}
let Zl = 0;
function Ql(e, t, o) {
  const r = Zl++, n = br.bind(null, o, r);
  if (!t.pending.length)
    return n;
  const l = {
    id: r,
    icons: t,
    callback: e,
    abort: n
  };
  return o.forEach((s) => {
    (s.loaderCallbacks || (s.loaderCallbacks = [])).push(l);
  }), n;
}
function es(e) {
  const t = {
    loaded: [],
    missing: [],
    pending: []
  }, o = /* @__PURE__ */ Object.create(null);
  e.sort((n, l) => n.provider !== l.provider ? n.provider.localeCompare(l.provider) : n.prefix !== l.prefix ? n.prefix.localeCompare(l.prefix) : n.name.localeCompare(l.name));
  let r = {
    provider: "",
    prefix: "",
    name: ""
  };
  return e.forEach((n) => {
    if (r.name === n.name && r.prefix === n.prefix && r.provider === n.provider)
      return;
    r = n;
    const l = n.provider, s = n.prefix, d = n.name, a = o[l] || (o[l] = /* @__PURE__ */ Object.create(null)), i = a[s] || (a[s] = pt(l, s));
    let u;
    d in i.icons ? u = t.loaded : s === "" || i.missing.has(d) ? u = t.missing : u = t.pending;
    const f = {
      provider: l,
      prefix: s,
      name: d
    };
    u.push(f);
  }), t;
}
function ts(e, t = !0, o = !1) {
  const r = [];
  return e.forEach((n) => {
    const l = typeof n == "string" ? Gt(n, t, o) : n;
    l && r.push(l);
  }), r;
}
const os = {
  resources: [],
  index: 0,
  timeout: 2e3,
  rotate: 750,
  random: !1,
  dataAfterTimeout: !1
};
function ns(e, t, o, r) {
  const n = e.resources.length, l = e.random ? Math.floor(Math.random() * n) : e.index;
  let s;
  if (e.random) {
    let E = e.resources.slice(0);
    for (s = []; E.length > 1; ) {
      const M = Math.floor(Math.random() * E.length);
      s.push(E[M]), E = E.slice(0, M).concat(E.slice(M + 1));
    }
    s = s.concat(E);
  } else
    s = e.resources.slice(l).concat(e.resources.slice(0, l));
  const d = Date.now();
  let a = "pending", i = 0, u, f = null, p = [], b = [];
  typeof r == "function" && b.push(r);
  function y() {
    f && (clearTimeout(f), f = null);
  }
  function w() {
    a === "pending" && (a = "aborted"), y(), p.forEach((E) => {
      E.status === "pending" && (E.status = "aborted");
    }), p = [];
  }
  function k(E, M) {
    M && (b = []), typeof E == "function" && b.push(E);
  }
  function F() {
    return {
      startTime: d,
      payload: t,
      status: a,
      queriesSent: i,
      queriesPending: p.length,
      subscribe: k,
      abort: w
    };
  }
  function m() {
    a = "failed", b.forEach((E) => {
      E(void 0, u);
    });
  }
  function T() {
    p.forEach((E) => {
      E.status === "pending" && (E.status = "aborted");
    }), p = [];
  }
  function O(E, M, K) {
    const z = M !== "success";
    switch (p = p.filter((oe) => oe !== E), a) {
      case "pending":
        break;
      case "failed":
        if (z || !e.dataAfterTimeout)
          return;
        break;
      default:
        return;
    }
    if (M === "abort") {
      u = K, m();
      return;
    }
    if (z) {
      u = K, p.length || (s.length ? N() : m());
      return;
    }
    if (y(), T(), !e.random) {
      const oe = e.resources.indexOf(E.resource);
      oe !== -1 && oe !== e.index && (e.index = oe);
    }
    a = "completed", b.forEach((oe) => {
      oe(K);
    });
  }
  function N() {
    if (a !== "pending")
      return;
    y();
    const E = s.shift();
    if (E === void 0) {
      if (p.length) {
        f = setTimeout(() => {
          y(), a === "pending" && (T(), m());
        }, e.timeout);
        return;
      }
      m();
      return;
    }
    const M = {
      status: "pending",
      resource: E,
      callback: (K, z) => {
        O(M, K, z);
      }
    };
    p.push(M), i++, f = setTimeout(N, e.rotate), o(E, t, M.callback);
  }
  return setTimeout(N), F;
}
function _r(e) {
  const t = {
    ...os,
    ...e
  };
  let o = [];
  function r() {
    o = o.filter((s) => s().status === "pending");
  }
  function n(s, d, a) {
    const i = ns(t, s, d, (u, f) => {
      r(), a && a(u, f);
    });
    return o.push(i), i;
  }
  function l(s) {
    return o.find((d) => s(d)) || null;
  }
  return {
    query: n,
    find: l,
    setIndex: (s) => {
      t.index = s;
    },
    getIndex: () => t.index,
    cleanup: r
  };
}
function kn() {
}
const so = /* @__PURE__ */ Object.create(null);
function rs(e) {
  if (!so[e]) {
    const t = Ko(e);
    if (!t)
      return;
    so[e] = {
      config: t,
      redundancy: _r(t)
    };
  }
  return so[e];
}
function ls(e, t, o) {
  let r, n;
  if (typeof e == "string") {
    const l = Do(e);
    if (!l)
      return o(void 0, 424), kn;
    n = l.send;
    const s = rs(e);
    s && (r = s.redundancy);
  } else {
    const l = Jo(e);
    if (l) {
      r = _r(l);
      const s = Do(e.resources ? e.resources[0] : "");
      s && (n = s.send);
    }
  }
  return !r || !n ? (o(void 0, 424), kn) : r.query(t, n, o)().abort;
}
function xn() {
}
function ss(e) {
  e.iconsLoaderFlag || (e.iconsLoaderFlag = !0, setTimeout(() => {
    e.iconsLoaderFlag = !1, Xl(e);
  }));
}
function as(e) {
  const t = [], o = [];
  return e.forEach((r) => {
    (r.match(fr) ? t : o).push(r);
  }), {
    valid: t,
    invalid: o
  };
}
function St(e, t, o) {
  function r() {
    const n = e.pendingIcons;
    t.forEach((l) => {
      n && n.delete(l), e.icons[l] || e.missing.add(l);
    });
  }
  if (o && typeof o == "object")
    try {
      if (!vr(e, o).length) {
        r();
        return;
      }
    } catch (n) {
      console.error(n);
    }
  r(), ss(e);
}
function Cn(e, t) {
  e instanceof Promise ? e.then((o) => {
    t(o);
  }).catch(() => {
    t(null);
  }) : t(e);
}
function is(e, t) {
  e.iconsToLoad ? e.iconsToLoad = e.iconsToLoad.concat(t).sort() : e.iconsToLoad = t, e.iconsQueueFlag || (e.iconsQueueFlag = !0, setTimeout(() => {
    e.iconsQueueFlag = !1;
    const { provider: o, prefix: r } = e, n = e.iconsToLoad;
    if (delete e.iconsToLoad, !n || !n.length)
      return;
    const l = e.loadIcon;
    if (e.loadIcons && (n.length > 1 || !l)) {
      Cn(e.loadIcons(n, r, o), (i) => {
        St(e, n, i);
      });
      return;
    }
    if (l) {
      n.forEach((i) => {
        Cn(l(i, r, o), (u) => {
          St(e, [i], u ? {
            prefix: r,
            icons: { [i]: u }
          } : null);
        });
      });
      return;
    }
    const { valid: s, invalid: d } = as(n);
    if (d.length && St(e, d, null), !s.length)
      return;
    const a = r.match(fr) ? Do(o) : null;
    if (!a) {
      St(e, s, null);
      return;
    }
    a.prepare(o, r, s).forEach((i) => {
      ls(o, i, (u) => {
        St(e, i.icons, u);
      });
    });
  }));
}
const ds = (e, t) => {
  const o = es(ts(e, !0, gr()));
  if (!o.pending.length) {
    let d = !0;
    return t && setTimeout(() => {
      d && t(o.loaded, o.missing, o.pending, xn);
    }), () => {
      d = !1;
    };
  }
  const r = /* @__PURE__ */ Object.create(null), n = [];
  let l, s;
  return o.pending.forEach((d) => {
    const { provider: a, prefix: i } = d;
    if (i === s && a === l)
      return;
    l = a, s = i, n.push(pt(a, i));
    const u = r[a] || (r[a] = /* @__PURE__ */ Object.create(null));
    u[i] || (u[i] = []);
  }), o.pending.forEach((d) => {
    const { provider: a, prefix: i, name: u } = d, f = pt(a, i), p = f.pendingIcons || (f.pendingIcons = /* @__PURE__ */ new Set());
    p.has(u) || (p.add(u), r[a][i].push(u));
  }), n.forEach((d) => {
    const a = r[d.provider][d.prefix];
    a.length && is(d, a);
  }), t ? Ql(t, o, n) : xn;
};
function us(e, t) {
  const o = { ...e };
  for (const r in t) {
    const n = t[r], l = typeof n;
    r in wr ? (n === null || n && (l === "string" || l === "number")) && (o[r] = n) : l === typeof o[r] && (o[r] = r === "rotate" ? n % 4 : n);
  }
  return o;
}
const cs = /[\s,]+/;
function fs(e, t) {
  t.split(cs).forEach((o) => {
    switch (o.trim()) {
      case "horizontal":
        e.hFlip = !0;
        break;
      case "vertical":
        e.vFlip = !0;
        break;
    }
  });
}
function ps(e, t = 0) {
  const o = e.replace(/^-?[0-9.]*/, "");
  function r(n) {
    for (; n < 0; )
      n += 4;
    return n % 4;
  }
  if (o === "") {
    const n = parseInt(e);
    return isNaN(n) ? 0 : r(n);
  } else if (o !== e) {
    let n = 0;
    switch (o) {
      case "%":
        n = 25;
        break;
      case "deg":
        n = 90;
    }
    if (n) {
      let l = parseFloat(e.slice(0, e.length - o.length));
      return isNaN(l) ? 0 : (l = l / n, l % 1 === 0 ? r(l) : 0);
    }
  }
  return t;
}
function hs(e, t) {
  let o = e.indexOf("xlink:") === -1 ? "" : ' xmlns:xlink="http://www.w3.org/1999/xlink"';
  for (const r in t)
    o += " " + r + '="' + t[r] + '"';
  return '<svg xmlns="http://www.w3.org/2000/svg"' + o + ">" + e + "</svg>";
}
function ms(e) {
  return e.replace(/"/g, "'").replace(/%/g, "%25").replace(/#/g, "%23").replace(/</g, "%3C").replace(/>/g, "%3E").replace(/\s+/g, " ");
}
function vs(e) {
  return "data:image/svg+xml," + ms(e);
}
function gs(e) {
  return 'url("' + vs(e) + '")';
}
const Sn = {
  ...yr,
  inline: !1
}, ws = {
  xmlns: "http://www.w3.org/2000/svg",
  "xmlns:xlink": "http://www.w3.org/1999/xlink",
  "aria-hidden": !0,
  role: "img"
}, ys = {
  display: "inline-block"
}, Vo = {
  backgroundColor: "currentColor"
}, kr = {
  backgroundColor: "transparent"
}, Nn = {
  Image: "var(--svg)",
  Repeat: "no-repeat",
  Size: "100% 100%"
}, In = {
  webkitMask: Vo,
  mask: Vo,
  background: kr
};
for (const e in In) {
  const t = In[e];
  for (const o in Nn)
    t[e + o] = Nn[o];
}
const Ot = {};
["horizontal", "vertical"].forEach((e) => {
  const t = e.slice(0, 1) + "Flip";
  Ot[e + "-flip"] = t, Ot[e.slice(0, 1) + "-flip"] = t, Ot[e + "Flip"] = t;
});
function En(e) {
  return e + (e.match(/^[-0-9.]+$/) ? "px" : "");
}
const Tn = (e, t) => {
  const o = us(Sn, t), r = { ...ws }, n = t.mode || "svg", l = {}, s = t.style, d = typeof s == "object" && !(s instanceof Array) ? s : {};
  for (let w in t) {
    const k = t[w];
    if (k !== void 0)
      switch (w) {
        case "icon":
        case "style":
        case "onLoad":
        case "mode":
        case "ssr":
        case "customise":
          break;
        case "inline":
        case "hFlip":
        case "vFlip":
          o[w] = k === !0 || k === "true" || k === 1;
          break;
        case "flip":
          typeof k == "string" && fs(o, k);
          break;
        case "color":
          l.color = k;
          break;
        case "rotate":
          typeof k == "string" ? o[w] = ps(k) : typeof k == "number" && (o[w] = k);
          break;
        case "ariaHidden":
        case "aria-hidden":
          k !== !0 && k !== "true" && delete r["aria-hidden"];
          break;
        default: {
          const F = Ot[w];
          F ? (k === !0 || k === "true" || k === 1) && (o[F] = !0) : Sn[w] === void 0 && (r[w] = k);
        }
      }
  }
  const a = Fl(e, o), i = a.attributes;
  if (o.inline && (l.verticalAlign = "-0.125em"), n === "svg")
    return r.style = {
      ...l,
      ...d
    }, Object.assign(r, i), r.innerHTML = Ul(a.body), Ut("svg", r);
  const { body: u, width: f, height: p } = e, b = n === "mask" || (n === "bg" ? !1 : u.indexOf("currentColor") !== -1), y = hs(u, {
    ...i,
    width: f + "",
    height: p + ""
  });
  return r.style = {
    ...l,
    "--svg": gs(y),
    width: En(i.width),
    height: En(i.height),
    ...ys,
    ...b ? Vo : kr,
    ...d
  }, Ut("span", r);
};
gr(!0);
zl("", Kl);
if (typeof document < "u" && typeof window < "u") {
  const e = window;
  if (e.IconifyPreload !== void 0) {
    const t = e.IconifyPreload, o = "Invalid IconifyPreload syntax.";
    typeof t == "object" && t !== null && (t instanceof Array ? t : [t]).forEach((r) => {
      try {
        // Check if item is an object and not null/array
        (typeof r != "object" || r === null || r instanceof Array || // Check for 'icons' and 'prefix'
        typeof r.icons != "object" || typeof r.prefix != "string" || // Add icon set
        !Go(r)) && console.error(o);
      } catch {
        console.error(o);
      }
    });
  }
  if (e.IconifyProviders !== void 0) {
    const t = e.IconifyProviders;
    if (typeof t == "object" && t !== null)
      for (let o in t) {
        const r = "IconifyProviders[" + o + "] is invalid.";
        try {
          const n = t[o];
          if (typeof n != "object" || !n || n.resources === void 0)
            continue;
          ql(o, n) || console.error(r);
        } catch {
          console.error(r);
        }
      }
  }
}
const bs = {
  ...Jt,
  body: ""
}, _s = be((e, { emit: t }) => {
  const o = D(null);
  function r() {
    var i, u;
    o.value && ((u = (i = o.value).abort) == null || u.call(i), o.value = null);
  }
  const n = D(!!e.ssr), l = D(""), s = il(null);
  function d() {
    const i = e.icon;
    if (typeof i == "object" && i !== null && typeof i.body == "string")
      return l.value = "", {
        data: i
      };
    let u;
    if (typeof i != "string" || (u = Gt(i, !1, !0)) === null)
      return null;
    let f = Pl(u);
    if (!f) {
      const y = o.value;
      return (!y || y.name !== i) && (f === null ? o.value = {
        name: i
      } : o.value = {
        name: i,
        abort: ds([u], a)
      }), null;
    }
    r(), l.value !== i && (l.value = i, et(() => {
      t("load", i);
    }));
    const p = e.customise;
    if (p) {
      f = Object.assign({}, f);
      const y = p(f.body, u.name, u.prefix, u.provider);
      typeof y == "string" && (f.body = y);
    }
    const b = ["iconify"];
    return u.prefix !== "" && b.push("iconify--" + u.prefix), u.provider !== "" && b.push("iconify--" + u.provider), { data: f, classes: b };
  }
  function a() {
    var u;
    const i = d();
    i ? i.data !== ((u = s.value) == null ? void 0 : u.data) && (s.value = i) : s.value = null;
  }
  return n.value ? a() : Uo(() => {
    n.value = !0, a();
  }), de(() => e.icon, a), Wt(r), () => {
    const i = s.value;
    if (!i)
      return Tn(bs, e);
    let u = e;
    return i.classes && (u = {
      ...e,
      class: i.classes.join(" ")
    }), Tn({
      ...Jt,
      ...i.data
    }, u);
  };
}, {
  props: [
    // Icon and render mode
    "icon",
    "mode",
    "ssr",
    // Layout and style
    "width",
    "height",
    "style",
    "color",
    "inline",
    // Transformations
    "rotate",
    "hFlip",
    "horizontalFlip",
    "vFlip",
    "verticalFlip",
    "flip",
    // Misc
    "id",
    "ariaHidden",
    "customise",
    "title"
  ],
  emits: ["load"]
}), ks = {
  prefix: "ep",
  width: 1024,
  height: 1024,
  icons: {
    "zoom-out": {
      body: '<path fill="currentColor" d="m795.9 750.7l125 125a32 32 0 0 1-45.3 45.2l-125-125a416 416 0 1 1 45.3-45.2M480 832a352 352 0 1 0 0-704a352 352 0 0 0 0 704M352 448h256a32 32 0 0 1 0 64H352a32 32 0 0 1 0-64"/>'
    },
    "zoom-in": {
      body: '<path fill="currentColor" d="m795.9 750.7l125 125a32 32 0 0 1-45.3 45.2l-125-125a416 416 0 1 1 45.3-45.2M480 832a352 352 0 1 0 0-704a352 352 0 0 0 0 704m-32-384v-96a32 32 0 0 1 64 0v96h96a32 32 0 0 1 0 64h-96v96a32 32 0 0 1-64 0v-96h-96a32 32 0 0 1 0-64z"/>'
    },
    rank: {
      body: '<path fill="currentColor" d="m186.5 544l41.4 41.3a32 32 0 1 1-45.2 45.4l-96-96a32 32 0 0 1 0-45.4l96-96a32 32 0 1 1 45.2 45.4L186.5 480h290.8V186.4L435.8 228a32 32 0 1 1-45.2-45.2l96-96.1a32 32 0 0 1 45.3 0l96 96a32 32 0 0 1-45.2 45.2l-41.4-41.2V480H832l-41.3-41.3a32 32 0 0 1 45.2-45.4l96 96a32 32 0 0 1 0 45.4l-96 96a32 32 0 0 1-45.2-45.4L832 544H541.3v293.4l41.4-41.2a32 32 0 1 1 45.2 45.2l-96 96a32 32 0 0 1-45.3 0l-96-96a32 32 0 1 1 45.3-45.2l41.4 41.4V544z"/>'
    },
    download: {
      body: '<path fill="currentColor" d="M160 832h704a32 32 0 1 1 0 64H160a32 32 0 1 1 0-64m384-253.7L780.3 342l45.2 45.2L508.8 704L192 387.2l45.2-45.2L480 584.7V128h64z"/>'
    },
    "d-arrow-left": {
      body: '<path fill="currentColor" d="M529.4 149.4a29 29 0 0 1 41.7 0a30.6 30.6 0 0 1 0 42.7L259.3 511.9L571 832a30.6 30.6 0 0 1-.5 43.2a29 29 0 0 1-41.2-.5L197.8 534.3a32 32 0 0 1 0-44.7zm256 0a29 29 0 0 1 41.7 0a30.6 30.6 0 0 1 0 42.7L515.3 511.9L827 832a30.6 30.6 0 0 1-.5 43.2a29 29 0 0 1-41.2-.5L453.8 534.3a32 32 0 0 1 0-44.7z"/>'
    },
    "d-arrow-right": {
      body: '<path fill="currentColor" d="M452.9 149.3a29 29 0 0 1 41.7 0l331.6 340.4a32 32 0 0 1 0 44.6L494.6 874.6a29 29 0 0 1-41.7 0a30.6 30.6 0 0 1 0-42.7L764.7 512L453 192a30.6 30.6 0 0 1 0-42.7m-256 0a29 29 0 0 1 41.7 0l331.6 340.4a32 32 0 0 1 0 44.6L238.6 874.6a29 29 0 0 1-41.7 0a30.6 30.6 0 0 1 0-42.7L508.7 512L197 192a30.6 30.6 0 0 1 0-42.7"/>'
    },
    picture: {
      body: '<path fill="currentColor" d="M160 160v704h704V160zm-32-64h768a32 32 0 0 1 32 32v768a32 32 0 0 1-32 32H128a32 32 0 0 1-32-32V128a32 32 0 0 1 32-32"/><path fill="currentColor" d="M384 288q64 0 64 64t-64 64t-64-64t64-64M185.4 877l-50.8-39l216.1-282a96 96 0 0 1 134.6-17.8l1.9 1.4L610 638.8a32 32 0 0 0 45-4.9L871 364l50 40l-215.8 269.8l-.3.3a96 96 0 0 1-135 14.5l-123-99.1l-.6-.5a32 32 0 0 0-44.8 6z"/>'
    },
    delete: {
      body: '<path fill="currentColor" d="M160 256H96a32 32 0 0 1 0-64h256V96a32 32 0 0 1 32-32h256a32 32 0 0 1 32 32v96h256a32 32 0 1 1 0 64h-64v672a32 32 0 0 1-32 32H192a32 32 0 0 1-32-32zm448-64v-64H416v64zM224 896h576V256H224zm192-128a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32m192 0a32 32 0 0 1-32-32V416a32 32 0 0 1 64 0v320a32 32 0 0 1-32 32"/>'
    },
    search: {
      body: '<path fill="currentColor" d="m795.9 750.7l125 125a32 32 0 0 1-45.3 45.2l-125-125a416 416 0 1 1 45.3-45.2M480 832a352 352 0 1 0 0-704a352 352 0 0 0 0 704"/>'
    },
    "warning-filled": {
      body: '<path fill="currentColor" d="M512 64a448 448 0 1 1 0 896a448 448 0 0 1 0-896m0 192a58.4 58.4 0 0 0-58.2 63.7L477 576.1a35 35 0 0 0 69.8 0l23.3-256.4A58.4 58.4 0 0 0 512 256m0 512a51.2 51.2 0 1 0 0-102.4a51.2 51.2 0 0 0 0 102.4"/>'
    }
  }
}, xs = {
  prefix: "wf",
  icons: {
    flowName: {
      width: 24,
      height: 24,
      body: '<rect x="8.75" y="2.75" width="6.5" height="4.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="2.75" y="16.75" width="6.5" height="4.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="14.75" y="16.75" width="6.5" height="4.5" rx="1.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 7.25V11.5M6 16.75V13.5H18V16.75" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    save: {
      width: 24,
      height: 24,
      body: '<path d="M18.5 21H5.5C4.4 21 3.5 20.1 3.5 19V5C3.5 3.9 4.4 3 5.5 3H15.5L20.5 8V19C20.5 20.1 19.6 21 18.5 21Z" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/><path d="M7.5 3V8H15" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/><path d="M7.5 21V14.5H16.5V21" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>'
    },
    baseInfo: {
      width: 24,
      height: 24,
      body: '<rect x="4.5" y="3" width="15" height="18" rx="2.2" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M8.5 8H15.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M8.5 12H15.5" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M8.5 16H13" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
    },
    flowDesign: {
      width: 24,
      height: 24,
      body: '<circle cx="5" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="19" cy="6" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/><circle cx="12" cy="18" r="2.6" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M7.6 6H16.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6.4 8.2L10.6 15.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M17.6 8.2L13.4 15.8" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/>'
    },
    classic: {
      width: 24,
      height: 24,
      body: '<rect x="2.5" y="2.75" width="7.5" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="2.75" width="7.5" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><rect x="14" y="16.25" width="7.5" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M10 5.25H14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><path d="M6.25 7.75V18.75H14" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/>'
    },
    mimic: {
      width: 24,
      height: 24,
      body: '<circle cx="12" cy="4" r="2.1" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 6.1V9.4" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><rect x="6.5" y="9.5" width="11" height="5" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.7"/><path d="M12 14.6V17.9" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/><circle cx="12" cy="20" r="2.1" fill="none" stroke="currentColor" stroke-width="1.7"/>'
    },
    close: {
      width: 1024,
      height: 1024,
      body: '<path fill="currentColor" d="M764.288 214.592 512 466.88 259.712 214.592a31.936 31.936 0 0 0-45.12 45.12L466.752 512 214.528 764.224a31.936 31.936 0 1 0 45.12 45.184L512 557.184l252.288 252.288a31.936 31.936 0 0 0 45.12-45.12L557.12 512.064l252.288-252.352a31.936 31.936 0 1 0-45.12-45.184z"/>'
    },
    inclusive: {
      width: 1024,
      height: 1024,
      body: '<path d="M557.376 15.68a73.408 73.408 0 0 0-97.088 5.696L21.376 460.288l-5.696 6.4a73.408 73.408 0 0 0 5.696 97.024l438.912 438.912 6.4 5.696a73.408 73.408 0 0 0 97.024-5.696l438.912-438.912 5.696-6.336a73.408 73.408 0 0 0-5.696-97.088L563.712 21.376l-6.4-5.696zM105.408 512L512 105.408 918.592 512 512 918.592 105.408 512zM512 272a240 240 0 1 0 0 480 240 240 0 0 0 0-480z m0 96a144 144 0 1 1 0 288 144 144 0 0 1 0-288z" fill="#409eff"/>'
    },
    between: {
      width: 1024,
      height: 1024,
      body: '<path d="M513.1776 511.3344m-450.816 0a450.816 450.816 0 1 0 901.632 0 450.816 450.816 0 1 0-901.632 0Z" fill="#ecf5ff"/><path d="M588.1856 491.776h10.3936c42.496 0.1536 84.992-0.3584 127.488 0.6656 28.9792 0.7168 54.528 26.5216 55.296 55.552 0.9728 36.1984 0.6656 72.3968 0.512 108.5952-0.0512 13.8752-8.3456 21.0944-22.9376 21.1456-43.008 0.0512-86.0672 0-129.0752 0H270.8992c-19.968 0-26.624-6.5024-26.5728-26.3168 0.1024-34.6112-0.3072-69.2736 0.6656-103.8848 0.768-28.416 26.5728-54.4256 54.9376-55.1424 42.496-1.024 84.992-0.5632 127.488-0.7168h10.9056c-1.1264-14.336-5.7856-26.8288-12.544-38.1952a359.51104 359.51104 0 0 0-26.2144-38.144c-49.2032-62.6688-38.8096-153.856 23.6544-203.4176 63.4368-50.432 156.0064-38.3488 204.9536 26.7264 43.1616 57.3952 39.4752 131.2768-9.472 186.2144-15.9744 17.92-26.0608 38.5024-30.208 62.0544-0.3072 1.3824-0.2048 2.6624-0.3072 4.864zM778.0352 727.7056c-4.9664-5.5296-14.4384-12.1856-31.1808-12.1856-162.6624 0-304.7936 0-467.456 0.0512-4.6592 0-8.7552 0.4096-12.5952 1.28-16.5888 3.7888-27.5968 18.5856-26.7264 35.9424 0.9216 17.664 13.3632 30.72 30.9248 32.512 3.6864 0.3584 7.2704 0.3584 10.4448 0.3584h464.128c3.3792 0 7.2192 0 11.264-0.512 16.0768-2.0992 27.648-13.9264 29.3888-30.1568 1.0752-10.6496-1.7408-20.1216-8.192-27.2896z" fill="#2b7de9"/><path d="M670.8736 677.7856a430.9504 430.9504 0 0 0 85.0432-175.2064c-8.7552-6.0928-19.0464-9.8304-29.8496-10.0864-42.496-1.024-84.992-0.512-127.488-0.6656h-10.3936c0.1024-2.2528 0-3.5328 0.256-4.7616 4.1472-23.552 14.2336-44.1344 30.208-62.0544 48.9472-54.9376 52.6336-128.8704 9.472-186.2144-48.9472-65.0752-141.4656-77.1584-204.9536-26.7264-62.4128 49.6128-72.8576 140.8-23.6544 203.4176 9.5232 12.1344 18.3296 24.9344 26.2144 38.144 6.7584 11.3664 11.4688 23.8592 12.544 38.1952h-10.9056c-42.496 0.1536-84.992-0.3072-127.488 0.7168-28.3648 0.6656-54.1184 26.7264-54.9376 55.1424-0.9728 34.6112-0.5632 69.2736-0.6656 103.8848-0.0512 19.7632 6.656 26.3168 26.5728 26.3168h358.9632c13.7216-0.1024 27.392-0.1024 41.0624-0.1024z" fill="#409eff"/><path d="M647.936 273.9712c-4.864-12.1856-11.4688-24.064-19.8656-35.2768-48.9472-65.0752-141.4656-77.1584-204.9536-26.7264-62.4128 49.6128-72.8576 140.8-23.6544 203.4176 9.5232 12.1344 18.3296 24.9344 26.2144 38.144 6.7584 11.3664 11.4688 23.8592 12.544 38.1952h-10.9056c-42.496 0.1536-84.992-0.3072-127.488 0.7168-28.3648 0.6656-54.1184 26.7264-54.9376 55.1424-0.9728 34.6112-0.5632 69.2736-0.6656 103.8848-0.0512 19.7632 6.656 26.3168 26.5728 26.3168h24.576c194.2016-36.096 342.784-201.6768 352.5632-403.8144z" fill="#66b1ff"/><path d="M531.712 182.1696c-37.376-5.0688-76.6464 4.4544-108.5952 29.8496-62.4128 49.6128-72.8576 140.8-23.6544 203.4176 0.4096 0.5632 0.8704 1.1264 1.28 1.6896 66.2528-61.2352 113.2032-142.8992 130.9696-234.9568z" fill="#a0cfff"/>'
    },
    serial: {
      width: 1024,
      height: 1024,
      body: '<path d="M85.418667 512L512.021333 85.397333 938.624 512 512.021333 938.602667z" fill="#ecf5ff"/><path d="M512 970.24a66.346667 66.346667 0 0 1-47.146667-19.413333L72.96 558.72a66.346667 66.346667 0 0 1 0-94.08L464.853333 72.533333a68.266667 68.266667 0 0 1 94.293334 0l392.106666 392.106667a66.773333 66.773333 0 0 1 0 94.08L559.146667 950.826667a66.346667 66.346667 0 0 1-47.146667 19.413333z m0-853.333333a2.986667 2.986667 0 0 0-1.92 0L118.186667 509.866667a2.56 2.56 0 0 0 0 3.626666l391.893333 392.106667a3.2 3.2 0 0 0 3.84 0l391.893333-392.106667a2.56 2.56 0 0 0 0-3.626666L513.92 117.76a2.986667 2.986667 0 0 0-1.92-0.64z" fill="#409eff"/><path d="M554.666667 516.266667l107.946666-107.946667a30.506667 30.506667 0 0 0-42.666666-42.666667L512 473.173333l-107.946667-107.946666a30.506667 30.506667 0 0 0-42.666666 42.666666L469.333333 516.266667l-108.8 107.946666a30.506667 30.506667 0 1 0 42.666667 42.666667l108.8-107.306667 106.666667 107.733334a30.506667 30.506667 0 0 0 42.666666-42.666667z" fill="#409eff"/>'
    },
    parallel: {
      width: 1024,
      height: 1024,
      body: '<path d="M85.418667 512L512.021333 85.397333 938.624 512 512.021333 938.602667z" fill="#ecf5ff"/><path d="M512 714.453333A32 32 0 0 1 480 682.666667v-138.666667H341.333333a32 32 0 1 1 0-64h138.666667V341.333333a32 32 0 0 1 64 0v138.666667H682.666667a32 32 0 0 1 0 64h-138.666667V682.666667a32 32 0 0 1-32 31.786666z" fill="#409eff"/><path d="M512 970.453333a66.56 66.56 0 0 1-47.146667-19.626666L72.96 558.933333a66.346667 66.346667 0 0 1 0-94.293333L464.853333 72.533333a68.266667 68.266667 0 0 1 94.293334 0l391.893333 392.106667a66.346667 66.346667 0 0 1 0 94.293333L559.146667 950.826667a66.56 66.56 0 0 1-47.146667 19.626666z m0-853.333333a2.986667 2.986667 0 0 0-1.92 0L118.186667 509.866667a2.56 2.56 0 0 0 0 3.626666l391.893333 392.106667a3.2 3.2 0 0 0 3.84 0l391.893333-392.106667a2.986667 2.986667 0 0 0 0-3.626666L513.92 117.76a2.986667 2.986667 0 0 0-1.92-0.64z" fill="#409eff"/>'
    },
    formDesign: {
      width: 1024,
      height: 1024,
      body: '<path d="M768 1024H256C115.2 1024 0 908.8 0 768V256C0 115.2 115.2 0 256 0h512c140.8 0 256 115.2 256 256v512c0 140.8-115.2 256-256 256z" fill="#0EB4F6"/><path d="M294.4 264.533c-25.6 0-44.8 19.2-44.8 44.8v44.8c0 25.6 19.2 44.8 44.8 44.8h405.333c25.6 0 44.8-19.2 44.8-44.8v-44.8c0-25.6-19.2-44.8-44.8-44.8H294.4z m-44.8 270.934c0 25.6 21.333 44.8 44.8 44.8h44.8c25.6 0 44.8-19.2 44.8-44.8v-44.8c0-25.6-21.333-44.8-44.8-44.8h-44.8c-25.6 0-44.8 19.2-44.8 44.8v44.8z m179.2 0c0 25.6 19.2 44.8 44.8 44.8h44.8c25.6 0 44.8-19.2 44.8-44.8v-44.8c0-25.6-19.2-44.8-44.8-44.8h-44.8c-25.6 0-44.8 19.2-44.8 44.8v44.8z m181.333 0c0 25.6 21.334 44.8 44.8 44.8h44.8c25.6 0 44.8-19.2 44.8-44.8v-44.8c0-25.6-21.333-44.8-44.8-44.8h-44.8c-25.6 0-44.8 19.2-44.8 44.8v44.8zM249.6 714.667c0 25.6 19.2 44.8 44.8 44.8h44.8c25.6 0 44.8-19.2 44.8-44.8v-44.8c0-25.6-19.2-44.8-44.8-44.8h-44.8c-25.6 0-44.8 19.2-44.8 44.8v44.8z m179.2 0c0 25.6 19.2 44.8 44.8 44.8h44.8c25.6 0 44.8-21.334 44.8-44.8v-44.8c0-25.6-19.2-44.8-44.8-44.8h-44.8c-25.6 0-44.8 21.333-44.8 44.8v44.8z m181.333 0c0 25.6 19.2 44.8 44.8 44.8h44.8c25.6 0 44.8-19.2 44.8-44.8v-44.8c0-25.6-19.2-44.8-44.8-44.8h-44.8c-25.6 0-44.8 19.2-44.8 44.8v44.8z" fill="#FFFFFF"/>'
    }
  }
};
Go(ks);
Go(xs);
let qt = null;
function Cp(e) {
  qt = e;
}
function ht() {
  if (!qt)
    throw new Error(
      "[warm-flow] UI 适配器未注册：请先 setUiAdapter(elementPlusAdapter) 或自定义适配器，或 app.use(WarmFlowDesigner)（会默认注册 Element Plus 适配器）"
    );
  return qt;
}
function Cs() {
  return qt !== null;
}
const Ss = {
  common: {
    save: "保存",
    cancel: "取消",
    confirm: "确定",
    delete: "删除",
    create: "新建",
    edit: "编辑",
    preview: "预览",
    export: "导出",
    reset: "重置",
    search: "查询",
    add: "新增",
    remove: "移除",
    loading: "加载中…",
    empty: "暂无数据",
    tip: "提示",
    success: "操作成功",
    failed: "操作失败",
    required: "必填项",
    pleaseSelect: "请选择",
    pleaseInput: "请输入",
    addRow: "增加行",
    operation: "操作",
    type: "类型",
    yes: "是",
    no: "否"
  },
  node: {
    codeLabel: "节点编码：",
    nameLabel: "节点名称："
  },
  start: {
    tabBase: "基础设置",
    tabListener: "监听器",
    listenerPath: "路径（可输入类路径）",
    listenerStart: "开始",
    listenerAssignment: "分派",
    listenerFinish: "完成",
    listenerCreate: "创建"
  },
  skip: {
    nameLabel: "跳转名称：",
    namePlaceholder: "跳转名称",
    typeLabel: "跳转类型：",
    conditionLabel: "跳转条件：",
    conditionName: "条件名",
    conditionTypePlaceholder: "请选择条件方式",
    typePass: "审批通过",
    typeReject: "退回",
    opGt: "大于",
    opGe: "大于等于",
    opEq: "等于",
    opNe: "不等于",
    opLt: "小于",
    opLe: "小于等于",
    opLike: "包含",
    opNotLike: "不包含",
    opDefault: "默认",
    defaultRequired: "请输入默认表达式",
    defaultFormat: "默认表达式必须以${开头，以}结尾",
    spelRequired: "请输入spel表达式",
    spelFormat: "spel表达式必须以#{开头，以}结尾",
    snelRequired: "请输入snel表达式",
    snelFormat: "snel表达式必须以#{开头，以}结尾",
    descDefault: "请输入默认表达式,格式如: ${flag == 5 && flag > 4}",
    descSpel: "请输入spel表达式，格式如: #{@user.eval(#flag)}",
    descSnel: "请输入snel表达式，格式如: #{@user.eval(flag)}"
  },
  sidebar: {
    baseNodes: "基础节点",
    gatewayNodes: "网关节点",
    start: "开始",
    between: "中间节点",
    end: "结束",
    serial: "互斥网关",
    parallel: "并行网关",
    inclusive: "包含网关"
  },
  property: {
    titleEdge: "设置边属性",
    titleSerial: "设置串行网关属性",
    titleParallel: "设置并行网关属性",
    titleInclusive: "设置包含网关属性",
    titleStart: "设置开始属性",
    titleEnd: "设置结束属性",
    titleBetween: "设置中间属性"
  },
  baseInfo: {
    sectionBasic: "基本配置",
    flowCode: "流程编码",
    flowCodePlaceholder: "请输入流程编码",
    flowName: "流程名称",
    flowNamePlaceholder: "请输入流程名称",
    model: "设计器模型",
    modelClassic: "经典模型",
    modelClassicDesc: "自由拖拽连线，灵活编排流程",
    modelMimic: "仿钉钉模型",
    modelMimicDesc: "类钉钉审批流，上下结构布局",
    modelSwitchWarning: "切换后重置节点，保存后不支持修改！",
    modelMobileWarning: "移动端不支持选择模型，如果新增默认仿钉钉",
    category: "流程类别",
    categoryPlaceholder: "请选择流程类别",
    formCustom: "自定义表单",
    formCustomTipY: "选择已配置的自定义表单",
    formCustomTipN: "填写审批页面路径",
    formPath: "表单路径",
    formPathPlaceholder: "请输入审批表单路径",
    formKey: "表单唯一标识",
    sectionListener: "监听器配置",
    listenerEmpty: "暂无监听器，点击下方「增加行」添加",
    listenerTypePlaceholder: "请选择类型",
    listenerPathLabel: "监听器（可输入类路径）",
    listenerPathPlaceholder: "请输入或选择",
    ruleModelRequired: "设计器模型不能为空",
    ruleFlowCodeRequired: "流程编码不能为空",
    ruleFlowNameRequired: "流程名称不能为空",
    ruleFormCustomRequired: "请选择审批表单是否自定义",
    ruleListenerRequired: "监听器不能为空"
  },
  between: {
    tabHandler: "办理人设置",
    extTag: "扩展",
    collaborativeWay: "协作方式：",
    wayOr: "或签",
    wayOrTip: "只需一个人审批",
    wayVote: "票签",
    wayVoteTip: "部分办理人审批，建议选择用户；如果选择角色或者部门等，需自行通过办理人表达式或者监听器，转成具体办理用户",
    waySign: "会签",
    waySignTip: "所有办理都需要审批，建议选择用户；如果选择角色或者部门等，需自行通过办理人表达式或者监听器，转成具体办理用户",
    ratioStrategy: "票签策略：",
    ratioStrategyPlaceholder: "请选择策略类型",
    ratioValueLabel: "策略值",
    ratioStrategyEmptyTip: "请先选择策略类型，再填写策略值",
    ratioPassRatio: "通过率（同意票占比）",
    ratioPassCount: "固定通过人数（N 人同意即通过）",
    ratioRejectCount: "固定驳回人数（N 人驳回即驳回）",
    ratioValueUnitPassRatio: "%",
    ratioValueUnitPassCount: "人",
    ratioValueUnitRejectCount: "人",
    ratioDefaultExpr: "默认表达式",
    ratioSpelExpr: "spel表达式",
    ratioSnelExpr: "snel表达式",
    rejectToNode: "驳回到指定节点",
    voteRejectRequired: "【票签】必须选择驳到指定节点！",
    formCustom: "自定义表单：",
    formCustomNoTip: "填写页面地址：如system/process/approve",
    formCustomYesTip: "填写自定义表单的唯一标识：如formCode+version",
    formPath: "表单路径：",
    formKey: "表单唯一标识：",
    extAttributes: "节点扩展属性",
    extCount: "{n}项",
    handlerStorageId: "入库主键",
    handlerName: "权限名称",
    addRowHandler: "添加行",
    selectHandler: "选择",
    userSelectTitle: "人员选择",
    ratioPassRatioRequired: "请输入通过率",
    ratioInvalidNumber: "请输入有效数字",
    ratioRange: "通过率必须在0.001-100之间",
    ratioDecimal: "通过率最多保留三位小数",
    ratioCountRequired: "请输入固定人数",
    ratioPositiveInt: "请输入正整数",
    listenerTypeRequired: "监听器类型不能为空",
    listenerPathRequired: "监听器路径不能为空",
    descPassRatio: "请输入通过率(0.001-100)",
    descPassCount: "请输入固定通过人数，类型为正整数",
    descRejectCount: "请输入固定驳回人数，类型为正整数",
    descDefault: "请输入默认表达式,格式如: ${flag > 4}"
  },
  selectUser: {
    orgTree: "组织架构",
    searchDept: "搜索部门名称",
    filter: "筛选",
    filterExpanded: "筛选条件",
    permCode: "权限编码",
    permCodePlaceholder: "请输入权限编码",
    permNamePlaceholder: "请输入权限名称",
    createTime: "创建时间",
    startDate: "开始日期",
    endDate: "结束日期",
    selectedPrefix: "已选择",
    selectedUnit: "项",
    more: "更多",
    clear: "清空",
    loadingMore: "加载中...",
    loadedAll: "— 已加载全部 —",
    emptyUsers: "暂无人员数据",
    permGroup: "权限分组"
  },
  flowDesigner: {
    untitled: "未命名流程",
    zoomOut: "缩小",
    fitView: "自适应",
    zoomIn: "放大",
    undo: "上一步",
    redo: "下一步",
    clear: "清空",
    downloadImage: "下载流程图",
    downloadJson: "下载JSON",
    emptyDef: "暂无流程定义",
    stepBaseInfo: "基础信息",
    stepFlowDesign: "流程设计",
    saving: "保存中，请稍等",
    saveSuccess: "保存成功",
    errNoStart: "缺少开始节点",
    errNoEnd: "缺少结束节点",
    errIsolated: "存在 {n} 个孤立节点（未连任何边）"
  },
  edgeTooltip: {
    approval: "审批"
  },
  baseNode: {
    initiator: "发起人",
    everyone: "所有人"
  },
  nodeExtList: {
    required: "{label}不能为空"
  }
}, Ns = {
  common: {
    save: "Save",
    cancel: "Cancel",
    confirm: "OK",
    delete: "Delete",
    create: "New",
    edit: "Edit",
    preview: "Preview",
    export: "Export",
    reset: "Reset",
    search: "Search",
    add: "Add",
    remove: "Remove",
    loading: "Loading…",
    empty: "No data",
    tip: "Tip",
    success: "Success",
    failed: "Failed",
    required: "Required",
    pleaseSelect: "Please select",
    pleaseInput: "Please enter",
    addRow: "Add row",
    operation: "Action",
    type: "Type",
    yes: "Yes",
    no: "No"
  },
  node: {
    codeLabel: "Node Code:",
    nameLabel: "Node Name:"
  },
  start: {
    tabBase: "Basic",
    tabListener: "Listeners",
    listenerPath: "Path (class path allowed)",
    listenerStart: "Start",
    listenerAssignment: "Assignment",
    listenerFinish: "Finish",
    listenerCreate: "Create"
  },
  skip: {
    nameLabel: "Transition Name:",
    namePlaceholder: "Transition name",
    typeLabel: "Transition Type:",
    conditionLabel: "Condition:",
    conditionName: "Condition name",
    conditionTypePlaceholder: "Select condition operator",
    typePass: "Approved",
    typeReject: "Rejected",
    opGt: "Greater than",
    opGe: "Greater or equal",
    opEq: "Equal",
    opNe: "Not equal",
    opLt: "Less than",
    opLe: "Less or equal",
    opLike: "Contains",
    opNotLike: "Not contains",
    opDefault: "Default",
    defaultRequired: "Please enter a default expression",
    defaultFormat: "Default expression must start with ${ and end with }",
    spelRequired: "Please enter a SpEL expression",
    spelFormat: "SpEL expression must start with #{ and end with }",
    snelRequired: "Please enter a SNEL expression",
    snelFormat: "SNEL expression must start with #{ and end with }",
    descDefault: "Enter a default expression, e.g.: ${flag == 5 && flag > 4}",
    descSpel: "Enter a SpEL expression, e.g.: #{@user.eval(#flag)}",
    descSnel: "Enter a SNEL expression, e.g.: #{@user.eval(flag)}"
  },
  sidebar: {
    baseNodes: "Basic Nodes",
    gatewayNodes: "Gateways",
    start: "Start",
    between: "Task",
    end: "End",
    serial: "Exclusive",
    parallel: "Parallel",
    inclusive: "Inclusive"
  },
  property: {
    titleEdge: "Edge Properties",
    titleSerial: "Exclusive Gateway Properties",
    titleParallel: "Parallel Gateway Properties",
    titleInclusive: "Inclusive Gateway Properties",
    titleStart: "Start Properties",
    titleEnd: "End Properties",
    titleBetween: "Task Properties"
  },
  baseInfo: {
    sectionBasic: "Basic Settings",
    flowCode: "Flow Code",
    flowCodePlaceholder: "Enter flow code",
    flowName: "Flow Name",
    flowNamePlaceholder: "Enter flow name",
    model: "Designer Model",
    modelClassic: "Classic",
    modelClassicDesc: "Free drag & connect, flexible orchestration",
    modelMimic: "DingTalk-like",
    modelMimicDesc: "DingTalk-style approval, top-down layout",
    modelSwitchWarning: "Switching resets nodes and cannot be changed after saving!",
    modelMobileWarning: "Model selection is not supported on mobile; new flows default to DingTalk-like",
    category: "Category",
    categoryPlaceholder: "Select category",
    formCustom: "Custom Form",
    formCustomTipY: "Choose a configured custom form",
    formCustomTipN: "Enter the approval page path",
    formPath: "Form Path",
    formPathPlaceholder: "Enter approval form path",
    formKey: "Form Key",
    sectionListener: "Listeners",
    listenerEmpty: 'No listeners. Click "Add row" below to add.',
    listenerTypePlaceholder: "Select type",
    listenerPathLabel: "Listener (class path allowed)",
    listenerPathPlaceholder: "Enter or select",
    ruleModelRequired: "Designer model is required",
    ruleFlowCodeRequired: "Flow code is required",
    ruleFlowNameRequired: "Flow name is required",
    ruleFormCustomRequired: "Please choose whether the form is custom",
    ruleListenerRequired: "Listener is required"
  },
  between: {
    tabHandler: "Assignees",
    extTag: "Ext",
    collaborativeWay: "Collaboration:",
    wayOr: "Or-sign",
    wayOrTip: "Only one approver is required",
    wayVote: "Vote",
    wayVoteTip: "Approved by some assignees; choosing users is recommended. If you pick roles/departments, convert them to concrete users via an assignee expression or listener.",
    waySign: "Counter-sign",
    waySignTip: "All assignees must approve; choosing users is recommended. If you pick roles/departments, convert them to concrete users via an assignee expression or listener.",
    ratioStrategy: "Vote Strategy:",
    ratioStrategyPlaceholder: "Select strategy type",
    ratioValueLabel: "Strategy value",
    ratioStrategyEmptyTip: "Select a strategy type first, then fill in its value",
    ratioPassRatio: "Pass ratio (agree percentage)",
    ratioPassCount: "Fixed pass count (pass when N agree)",
    ratioRejectCount: "Fixed reject count (reject when N reject)",
    ratioValueUnitPassRatio: "%",
    ratioValueUnitPassCount: "votes",
    ratioValueUnitRejectCount: "votes",
    ratioDefaultExpr: "Default expression",
    ratioSpelExpr: "SpEL expression",
    ratioSnelExpr: "SNEL expression",
    rejectToNode: "Reject to node",
    voteRejectRequired: "[Vote] You must select a reject-to node!",
    formCustom: "Custom Form:",
    formCustomNoTip: "Enter the page path, e.g. system/process/approve",
    formCustomYesTip: "Enter the custom form key, e.g. formCode+version",
    formPath: "Form Path:",
    formKey: "Form Key:",
    extAttributes: "Node Extensions",
    extCount: "{n} items",
    handlerStorageId: "Storage Key",
    handlerName: "Permission Name",
    addRowHandler: "Add row",
    selectHandler: "Select",
    userSelectTitle: "Select Users",
    ratioPassRatioRequired: "Please enter pass ratio",
    ratioInvalidNumber: "Please enter a valid number",
    ratioRange: "Pass ratio must be between 0.001 and 100",
    ratioDecimal: "Pass ratio keeps at most 3 decimals",
    ratioCountRequired: "Please enter a fixed count",
    ratioPositiveInt: "Please enter a positive integer",
    listenerTypeRequired: "Listener type is required",
    listenerPathRequired: "Listener path is required",
    descPassRatio: "Enter pass ratio (0.001-100)",
    descPassCount: "Enter fixed pass count (positive integer)",
    descRejectCount: "Enter fixed reject count (positive integer)",
    descDefault: "Enter a default expression, e.g.: ${flag > 4}"
  },
  selectUser: {
    orgTree: "Organization",
    searchDept: "Search department",
    filter: "Filter",
    filterExpanded: "Filters",
    permCode: "Permission Code",
    permCodePlaceholder: "Enter permission code",
    permNamePlaceholder: "Enter permission name",
    createTime: "Created At",
    startDate: "Start date",
    endDate: "End date",
    selectedPrefix: "Selected",
    selectedUnit: "items",
    more: "more",
    clear: "Clear",
    loadingMore: "Loading...",
    loadedAll: "— All loaded —",
    emptyUsers: "No users",
    permGroup: "Permission Group"
  },
  flowDesigner: {
    untitled: "Untitled Flow",
    zoomOut: "Zoom out",
    fitView: "Fit",
    zoomIn: "Zoom in",
    undo: "Undo",
    redo: "Redo",
    clear: "Clear",
    downloadImage: "Download image",
    downloadJson: "Download JSON",
    emptyDef: "No flow definition",
    stepBaseInfo: "Basic Info",
    stepFlowDesign: "Flow Design",
    saving: "Saving, please wait",
    saveSuccess: "Saved successfully",
    errNoStart: "Missing start node",
    errNoEnd: "Missing end node",
    errIsolated: "{n} isolated node(s) (not connected to any edge)"
  },
  edgeTooltip: {
    approval: "Approval"
  },
  baseNode: {
    initiator: "Initiator",
    everyone: "Everyone"
  },
  nodeExtList: {
    required: "{label} is required"
  }
}, Tt = { zh: Ss, en: Ns }, Yt = D("zh");
function Is(e) {
  Tt[e] && (Yt.value = e);
}
function Es() {
  return Yt.value;
}
function xr(e, t) {
  const o = { ...e };
  for (const r of Object.keys(t)) {
    const n = t[r], l = o[r];
    o[r] = typeof n == "object" && typeof l == "object" ? xr(l, n) : n;
  }
  return o;
}
function Sp(e, t) {
  Tt[e] = xr(Tt[e] ?? {}, t);
}
function Pn(e, t) {
  if (!e)
    return;
  let o = e;
  for (const r of t.split("."))
    if (o && typeof o == "object" && r in o)
      o = o[r];
    else
      return;
  return typeof o == "string" ? o : void 0;
}
function Ts(e, t) {
  const o = Pn(Tt[Yt.value], e) ?? Pn(Tt.zh, e) ?? e;
  return t ? o.replace(/\{(\w+)\}/g, (r, n) => t[n] != null ? String(t[n]) : "") : o;
}
function xe() {
  return { locale: Yt, t: Ts, setLocale: Is, getLocale: Es };
}
const Ps = { class: "start" }, $s = { class: "modern-tabs-wrapper" }, Ls = { class: "modern-tabs" }, Rs = ["onClick"], Ds = {
  class: "tab-icon",
  viewBox: "0 0 24 24"
}, Vs = ["d"], Ms = { class: "tab-label" }, Os = { class: "tabPane" }, Fs = { class: "base-settings-section" }, As = { class: "base-settings-content" }, Bs = { class: "tabPane tabPane-full" }, Us = { class: "section-card section-purple" }, zs = { class: "section-card-body" }, qs = { class: "action-buttons" }, js = /* @__PURE__ */ be({
  name: "Start",
  __name: "start",
  props: {
    modelValue: { default: () => ({}) },
    disabled: { type: Boolean, default: !1 }
  },
  emits: ["change"],
  setup(e, { emit: t }) {
    const { t: o } = xe(), r = e, n = {
      base: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
      listener: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z"
    }, l = le(() => [
      { name: "1", label: o("start.tabBase"), iconPath: n.base },
      { name: "2", label: o("start.tabListener"), iconPath: n.listener }
    ]), s = D("1"), d = D(r.modelValue), a = t, i = le(() => typeof window > "u" ? !1 : window.innerWidth <= 768), { proxy: u } = tt();
    de(() => d, (y) => {
      y && a("change", y);
    }, { deep: !0 });
    function f() {
      u.$refs.nodeInput.focus();
    }
    if (d.value.listenerType) {
      const y = d.value.listenerType.split(","), w = d.value.listenerPath.split("@@");
      d.value.listenerRows = y.map((k, F) => ({
        listenerType: k,
        listenerPath: w[F]
      }));
    }
    function p() {
      d.value.listenerRows.push({ listenerType: "", listenerPath: "" });
    }
    function b(y) {
      d.value.listenerRows.splice(y, 1);
    }
    return (y, w) => {
      const k = L("wf-input"), F = L("wf-form-item"), m = L("wf-form"), T = L("wf-option"), O = L("wf-select"), N = L("wf-table-column"), E = L("svg-icon"), M = L("wf-button"), K = L("wf-table");
      return _(), V("div", Ps, [
        v("div", $s, [
          v("div", Ls, [
            (_(!0), V(ve, null, ye(l.value, (z) => (_(), V("div", {
              key: z.name,
              class: _e(["modern-tab-item", { "is-active": s.value === z.name }]),
              onClick: (oe) => s.value = z.name
            }, [
              (_(), V("svg", Ds, [
                v("path", {
                  d: z.iconPath,
                  fill: "currentColor"
                }, null, 8, Vs)
              ])),
              v("span", Ms, A(z.label), 1)
            ], 10, Rs))), 128))
          ])
        ]),
        ke(v("div", Os, [
          h(m, {
            ref: "formRef",
            class: "startForm",
            model: d.value,
            "label-width": "110px",
            disabled: y.disabled
          }, {
            default: g(() => [
              v("div", Fs, [
                v("div", As, [
                  me(y.$slots, "form-item-task-name", {
                    model: d.value,
                    field: "nodeCode"
                  }, () => [
                    h(F, {
                      label: c(o)("node.codeLabel")
                    }, {
                      default: g(() => [
                        h(k, {
                          modelValue: d.value.nodeCode,
                          "onUpdate:modelValue": w[0] || (w[0] = (z) => d.value.nodeCode = z),
                          disabled: y.disabled
                        }, null, 8, ["modelValue", "disabled"])
                      ]),
                      _: 1
                    }, 8, ["label"])
                  ], !0),
                  me(y.$slots, "form-item-task-name", {
                    model: d.value,
                    field: "nodeName"
                  }, () => [
                    h(F, {
                      label: c(o)("node.nameLabel")
                    }, {
                      default: g(() => [
                        h(k, {
                          modelValue: d.value.nodeName,
                          "onUpdate:modelValue": w[1] || (w[1] = (z) => d.value.nodeName = z),
                          ref: "nodeInput",
                          disabled: y.disabled,
                          onChange: f
                        }, null, 8, ["modelValue", "disabled"])
                      ]),
                      _: 1
                    }, 8, ["label"])
                  ], !0),
                  me(y.$slots, "node-form-extra", {
                    form: d.value,
                    disabled: y.disabled
                  }, void 0, !0)
                ])
              ])
            ]),
            _: 3
          }, 8, ["model", "disabled"])
        ], 512), [
          [Ne, s.value === "1"]
        ]),
        ke(v("div", Bs, [
          v("div", Us, [
            v("div", zs, [
              me(y.$slots, "form-item-task-listenerType", {
                model: d.value,
                field: "listenerType"
              }, () => [
                h(K, {
                  data: d.value.listenerRows,
                  style: { width: "100%" }
                }, {
                  default: g(() => [
                    h(N, {
                      prop: "listenerType",
                      label: c(o)("common.type"),
                      width: i.value ? 60 : 160
                    }, {
                      default: g((z) => [
                        h(F, {
                          prop: "listenerRows." + z.$index + ".listenerType"
                        }, {
                          default: g(() => [
                            h(O, {
                              modelValue: z.row.listenerType,
                              "onUpdate:modelValue": (oe) => z.row.listenerType = oe,
                              placeholder: c(o)("common.pleaseSelect")
                            }, {
                              default: g(() => [
                                h(T, {
                                  label: c(o)("start.listenerStart"),
                                  value: "start"
                                }, null, 8, ["label"]),
                                h(T, {
                                  label: c(o)("start.listenerAssignment"),
                                  value: "assignment"
                                }, null, 8, ["label"]),
                                h(T, {
                                  label: c(o)("start.listenerFinish"),
                                  value: "finish"
                                }, null, 8, ["label"]),
                                h(T, {
                                  label: c(o)("start.listenerCreate"),
                                  value: "create"
                                }, null, 8, ["label"])
                              ]),
                              _: 2
                            }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])
                          ]),
                          _: 2
                        }, 1032, ["prop"])
                      ]),
                      _: 1
                    }, 8, ["label", "width"]),
                    h(N, {
                      prop: "listenerPath",
                      label: c(o)("start.listenerPath")
                    }, {
                      default: g((z) => [
                        h(F, {
                          prop: "listenerRows." + z.$index + ".listenerPath"
                        }, {
                          default: g(() => [
                            h(k, {
                              modelValue: z.row.listenerPath,
                              "onUpdate:modelValue": (oe) => z.row.listenerPath = oe,
                              placeholder: c(o)("common.pleaseInput")
                            }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])
                          ]),
                          _: 2
                        }, 1032, ["prop"])
                      ]),
                      _: 1
                    }, 8, ["label"]),
                    y.disabled ? j("", !0) : (_(), Y(N, {
                      key: 0,
                      label: c(o)("common.operation"),
                      width: "65",
                      align: "center"
                    }, {
                      default: g((z) => [
                        h(M, {
                          link: "",
                          size: "small",
                          type: "danger",
                          onClick: (oe) => b(z.$index)
                        }, {
                          default: g(() => [
                            h(E, { "icon-class": "ep:delete" })
                          ]),
                          _: 2
                        }, 1032, ["onClick"])
                      ]),
                      _: 1
                    }, 8, ["label"]))
                  ]),
                  _: 1
                }, 8, ["data"])
              ], !0),
              v("div", qs, [
                y.disabled ? j("", !0) : (_(), Y(M, {
                  key: 0,
                  class: "add-row-btn",
                  onClick: p
                }, {
                  default: g(() => [
                    Se(A(c(o)("common.addRow")), 1)
                  ]),
                  _: 1
                }))
              ])
            ])
          ])
        ], 512), [
          [Ne, s.value === "2"]
        ])
      ]);
    };
  }
}), Ee = (e, t) => {
  const o = e.__vccOpts || e;
  for (const [r, n] of t)
    o[r] = n;
  return o;
}, Hs = /* @__PURE__ */ Ee(js, [["__scopeId", "data-v-bbf67c3f"]]);
function Ws(e, t) {
  if (arguments.length === 0 || !e)
    return null;
  const o = t || "{y}-{m}-{d} {h}:{i}:{s}";
  let r;
  typeof e == "object" ? r = e : (typeof e == "string" && /^[0-9]+$/.test(e) ? e = parseInt(e) : typeof e == "string" && (e = e.replace(new RegExp(/-/gm), "/").replace("T", " ").replace(new RegExp(/\.[\d]{3}/gm), "")), typeof e == "number" && e.toString().length === 10 && (e = e * 1e3), r = new Date(e));
  const n = {
    y: r.getFullYear(),
    m: r.getMonth() + 1,
    d: r.getDate(),
    h: r.getHours(),
    i: r.getMinutes(),
    s: r.getSeconds(),
    a: r.getDay()
  };
  return o.replace(/{(y|m|d|h|i|s|a)+}/g, (s, d) => {
    let a = n[d];
    return d === "a" ? ["日", "一", "二", "三", "四", "五", "六"][a] : (s.length > 0 && a < 10 && (a = "0" + a), a || 0);
  });
}
function Gs(e) {
  let t = "";
  for (const n of Object.keys(e)) {
    const l = e[n];
    var o = encodeURIComponent(n) + "=";
    if (l !== null && l !== "" && typeof l < "u")
      if (typeof l == "object") {
        for (const s of Object.keys(l))
          if (l[s] !== null && l[s] !== "" && typeof l[s] < "u") {
            let d = n + "[" + s + "]";
            var r = encodeURIComponent(d) + "=";
            t += r + encodeURIComponent(l[s]) + "&";
          }
      } else
        t += o + encodeURIComponent(l) + "&";
  }
  return t;
}
function Js(e) {
  return e && e.__esModule && Object.prototype.hasOwnProperty.call(e, "default") ? e.default : e;
}
var Xo = { exports: {} }, Cr = function(t, o) {
  return function() {
    for (var n = new Array(arguments.length), l = 0; l < n.length; l++)
      n[l] = arguments[l];
    return t.apply(o, n);
  };
}, Ys = Cr, Zo = Object.prototype.toString, Qo = function(e) {
  return function(t) {
    var o = Zo.call(t);
    return e[o] || (e[o] = o.slice(8, -1).toLowerCase());
  };
}(/* @__PURE__ */ Object.create(null));
function rt(e) {
  return e = e.toLowerCase(), function(o) {
    return Qo(o) === e;
  };
}
function en(e) {
  return Array.isArray(e);
}
function jt(e) {
  return typeof e > "u";
}
function Ks(e) {
  return e !== null && !jt(e) && e.constructor !== null && !jt(e.constructor) && typeof e.constructor.isBuffer == "function" && e.constructor.isBuffer(e);
}
var Sr = rt("ArrayBuffer");
function Xs(e) {
  var t;
  return typeof ArrayBuffer < "u" && ArrayBuffer.isView ? t = ArrayBuffer.isView(e) : t = e && e.buffer && Sr(e.buffer), t;
}
function Zs(e) {
  return typeof e == "string";
}
function Qs(e) {
  return typeof e == "number";
}
function Nr(e) {
  return e !== null && typeof e == "object";
}
function Ft(e) {
  if (Qo(e) !== "object")
    return !1;
  var t = Object.getPrototypeOf(e);
  return t === null || t === Object.prototype;
}
var ea = rt("Date"), ta = rt("File"), oa = rt("Blob"), na = rt("FileList");
function tn(e) {
  return Zo.call(e) === "[object Function]";
}
function ra(e) {
  return Nr(e) && tn(e.pipe);
}
function la(e) {
  var t = "[object FormData]";
  return e && (typeof FormData == "function" && e instanceof FormData || Zo.call(e) === t || tn(e.toString) && e.toString() === t);
}
var sa = rt("URLSearchParams");
function aa(e) {
  return e.trim ? e.trim() : e.replace(/^\s+|\s+$/g, "");
}
function ia() {
  return typeof navigator < "u" && (navigator.product === "ReactNative" || navigator.product === "NativeScript" || navigator.product === "NS") ? !1 : typeof window < "u" && typeof document < "u";
}
function on(e, t) {
  if (!(e === null || typeof e > "u"))
    if (typeof e != "object" && (e = [e]), en(e))
      for (var o = 0, r = e.length; o < r; o++)
        t.call(null, e[o], o, e);
    else
      for (var n in e)
        Object.prototype.hasOwnProperty.call(e, n) && t.call(null, e[n], n, e);
}
function Mo() {
  var e = {};
  function t(n, l) {
    Ft(e[l]) && Ft(n) ? e[l] = Mo(e[l], n) : Ft(n) ? e[l] = Mo({}, n) : en(n) ? e[l] = n.slice() : e[l] = n;
  }
  for (var o = 0, r = arguments.length; o < r; o++)
    on(arguments[o], t);
  return e;
}
function da(e, t, o) {
  return on(t, function(n, l) {
    o && typeof n == "function" ? e[l] = Ys(n, o) : e[l] = n;
  }), e;
}
function ua(e) {
  return e.charCodeAt(0) === 65279 && (e = e.slice(1)), e;
}
function ca(e, t, o, r) {
  e.prototype = Object.create(t.prototype, r), e.prototype.constructor = e, o && Object.assign(e.prototype, o);
}
function fa(e, t, o) {
  var r, n, l, s = {};
  t = t || {};
  do {
    for (r = Object.getOwnPropertyNames(e), n = r.length; n-- > 0; )
      l = r[n], s[l] || (t[l] = e[l], s[l] = !0);
    e = Object.getPrototypeOf(e);
  } while (e && (!o || o(e, t)) && e !== Object.prototype);
  return t;
}
function pa(e, t, o) {
  e = String(e), (o === void 0 || o > e.length) && (o = e.length), o -= t.length;
  var r = e.indexOf(t, o);
  return r !== -1 && r === o;
}
function ha(e) {
  if (!e)
    return null;
  var t = e.length;
  if (jt(t))
    return null;
  for (var o = new Array(t); t-- > 0; )
    o[t] = e[t];
  return o;
}
var ma = function(e) {
  return function(t) {
    return e && t instanceof e;
  };
}(typeof Uint8Array < "u" && Object.getPrototypeOf(Uint8Array)), Ie = {
  isArray: en,
  isArrayBuffer: Sr,
  isBuffer: Ks,
  isFormData: la,
  isArrayBufferView: Xs,
  isString: Zs,
  isNumber: Qs,
  isObject: Nr,
  isPlainObject: Ft,
  isUndefined: jt,
  isDate: ea,
  isFile: ta,
  isBlob: oa,
  isFunction: tn,
  isStream: ra,
  isURLSearchParams: sa,
  isStandardBrowserEnv: ia,
  forEach: on,
  merge: Mo,
  extend: da,
  trim: aa,
  stripBOM: ua,
  inherits: ca,
  toFlatObject: fa,
  kindOf: Qo,
  kindOfTest: rt,
  endsWith: pa,
  toArray: ha,
  isTypedArray: ma,
  isFileList: na
}, st = Ie;
function $n(e) {
  return encodeURIComponent(e).replace(/%3A/gi, ":").replace(/%24/g, "$").replace(/%2C/gi, ",").replace(/%20/g, "+").replace(/%5B/gi, "[").replace(/%5D/gi, "]");
}
var Ir = function(t, o, r) {
  if (!o)
    return t;
  var n;
  if (r)
    n = r(o);
  else if (st.isURLSearchParams(o))
    n = o.toString();
  else {
    var l = [];
    st.forEach(o, function(a, i) {
      a === null || typeof a > "u" || (st.isArray(a) ? i = i + "[]" : a = [a], st.forEach(a, function(f) {
        st.isDate(f) ? f = f.toISOString() : st.isObject(f) && (f = JSON.stringify(f)), l.push($n(i) + "=" + $n(f));
      }));
    }), n = l.join("&");
  }
  if (n) {
    var s = t.indexOf("#");
    s !== -1 && (t = t.slice(0, s)), t += (t.indexOf("?") === -1 ? "?" : "&") + n;
  }
  return t;
}, va = Ie;
function Kt() {
  this.handlers = [];
}
Kt.prototype.use = function(t, o, r) {
  return this.handlers.push({
    fulfilled: t,
    rejected: o,
    synchronous: r ? r.synchronous : !1,
    runWhen: r ? r.runWhen : null
  }), this.handlers.length - 1;
};
Kt.prototype.eject = function(t) {
  this.handlers[t] && (this.handlers[t] = null);
};
Kt.prototype.forEach = function(t) {
  va.forEach(this.handlers, function(r) {
    r !== null && t(r);
  });
};
var ga = Kt, wa = Ie, ya = function(t, o) {
  wa.forEach(t, function(n, l) {
    l !== o && l.toUpperCase() === o.toUpperCase() && (t[o] = n, delete t[l]);
  });
}, Er = Ie;
function mt(e, t, o, r, n) {
  Error.call(this), this.message = e, this.name = "AxiosError", t && (this.code = t), o && (this.config = o), r && (this.request = r), n && (this.response = n);
}
Er.inherits(mt, Error, {
  toJSON: function() {
    return {
      // Standard
      message: this.message,
      name: this.name,
      // Microsoft
      description: this.description,
      number: this.number,
      // Mozilla
      fileName: this.fileName,
      lineNumber: this.lineNumber,
      columnNumber: this.columnNumber,
      stack: this.stack,
      // Axios
      config: this.config,
      code: this.code,
      status: this.response && this.response.status ? this.response.status : null
    };
  }
});
var Tr = mt.prototype, Pr = {};
[
  "ERR_BAD_OPTION_VALUE",
  "ERR_BAD_OPTION",
  "ECONNABORTED",
  "ETIMEDOUT",
  "ERR_NETWORK",
  "ERR_FR_TOO_MANY_REDIRECTS",
  "ERR_DEPRECATED",
  "ERR_BAD_RESPONSE",
  "ERR_BAD_REQUEST",
  "ERR_CANCELED"
  // eslint-disable-next-line func-names
].forEach(function(e) {
  Pr[e] = { value: e };
});
Object.defineProperties(mt, Pr);
Object.defineProperty(Tr, "isAxiosError", { value: !0 });
mt.from = function(e, t, o, r, n, l) {
  var s = Object.create(Tr);
  return Er.toFlatObject(e, s, function(a) {
    return a !== Error.prototype;
  }), mt.call(s, e.message, t, o, r, n), s.name = e.name, l && Object.assign(s, l), s;
};
var wt = mt, $r = {
  silentJSONParsing: !0,
  forcedJSONParsing: !0,
  clarifyTimeoutError: !1
}, Oe = Ie;
function ba(e, t) {
  t = t || new FormData();
  var o = [];
  function r(l) {
    return l === null ? "" : Oe.isDate(l) ? l.toISOString() : Oe.isArrayBuffer(l) || Oe.isTypedArray(l) ? typeof Blob == "function" ? new Blob([l]) : Buffer.from(l) : l;
  }
  function n(l, s) {
    if (Oe.isPlainObject(l) || Oe.isArray(l)) {
      if (o.indexOf(l) !== -1)
        throw Error("Circular reference detected in " + s);
      o.push(l), Oe.forEach(l, function(a, i) {
        if (!Oe.isUndefined(a)) {
          var u = s ? s + "." + i : i, f;
          if (a && !s && typeof a == "object") {
            if (Oe.endsWith(i, "{}"))
              a = JSON.stringify(a);
            else if (Oe.endsWith(i, "[]") && (f = Oe.toArray(a))) {
              f.forEach(function(p) {
                !Oe.isUndefined(p) && t.append(u, r(p));
              });
              return;
            }
          }
          n(a, u);
        }
      }), o.pop();
    } else
      t.append(s, r(l));
  }
  return n(e), t;
}
var Lr = ba, ao, Ln;
function _a() {
  if (Ln)
    return ao;
  Ln = 1;
  var e = wt;
  return ao = function(o, r, n) {
    var l = n.config.validateStatus;
    !n.status || !l || l(n.status) ? o(n) : r(new e(
      "Request failed with status code " + n.status,
      [e.ERR_BAD_REQUEST, e.ERR_BAD_RESPONSE][Math.floor(n.status / 100) - 4],
      n.config,
      n.request,
      n
    ));
  }, ao;
}
var io, Rn;
function ka() {
  if (Rn)
    return io;
  Rn = 1;
  var e = Ie;
  return io = e.isStandardBrowserEnv() ? (
    // Standard browser envs support document.cookie
    function() {
      return {
        write: function(r, n, l, s, d, a) {
          var i = [];
          i.push(r + "=" + encodeURIComponent(n)), e.isNumber(l) && i.push("expires=" + new Date(l).toGMTString()), e.isString(s) && i.push("path=" + s), e.isString(d) && i.push("domain=" + d), a === !0 && i.push("secure"), document.cookie = i.join("; ");
        },
        read: function(r) {
          var n = document.cookie.match(new RegExp("(^|;\\s*)(" + r + ")=([^;]*)"));
          return n ? decodeURIComponent(n[3]) : null;
        },
        remove: function(r) {
          this.write(r, "", Date.now() - 864e5);
        }
      };
    }()
  ) : (
    // Non standard browser env (web workers, react-native) lack needed support.
    function() {
      return {
        write: function() {
        },
        read: function() {
          return null;
        },
        remove: function() {
        }
      };
    }()
  ), io;
}
var xa = function(t) {
  return /^([a-z][a-z\d+\-.]*:)?\/\//i.test(t);
}, Ca = function(t, o) {
  return o ? t.replace(/\/+$/, "") + "/" + o.replace(/^\/+/, "") : t;
}, Sa = xa, Na = Ca, Rr = function(t, o) {
  return t && !Sa(o) ? Na(t, o) : o;
}, uo, Dn;
function Ia() {
  if (Dn)
    return uo;
  Dn = 1;
  var e = Ie, t = [
    "age",
    "authorization",
    "content-length",
    "content-type",
    "etag",
    "expires",
    "from",
    "host",
    "if-modified-since",
    "if-unmodified-since",
    "last-modified",
    "location",
    "max-forwards",
    "proxy-authorization",
    "referer",
    "retry-after",
    "user-agent"
  ];
  return uo = function(r) {
    var n = {}, l, s, d;
    return r && e.forEach(r.split(`
`), function(i) {
      if (d = i.indexOf(":"), l = e.trim(i.substr(0, d)).toLowerCase(), s = e.trim(i.substr(d + 1)), l) {
        if (n[l] && t.indexOf(l) >= 0)
          return;
        l === "set-cookie" ? n[l] = (n[l] ? n[l] : []).concat([s]) : n[l] = n[l] ? n[l] + ", " + s : s;
      }
    }), n;
  }, uo;
}
var co, Vn;
function Ea() {
  if (Vn)
    return co;
  Vn = 1;
  var e = Ie;
  return co = e.isStandardBrowserEnv() ? (
    // Standard browser envs have full support of the APIs needed to test
    // whether the request URL is of the same origin as current location.
    function() {
      var o = /(msie|trident)/i.test(navigator.userAgent), r = document.createElement("a"), n;
      function l(s) {
        var d = s;
        return o && (r.setAttribute("href", d), d = r.href), r.setAttribute("href", d), {
          href: r.href,
          protocol: r.protocol ? r.protocol.replace(/:$/, "") : "",
          host: r.host,
          search: r.search ? r.search.replace(/^\?/, "") : "",
          hash: r.hash ? r.hash.replace(/^#/, "") : "",
          hostname: r.hostname,
          port: r.port,
          pathname: r.pathname.charAt(0) === "/" ? r.pathname : "/" + r.pathname
        };
      }
      return n = l(window.location.href), function(d) {
        var a = e.isString(d) ? l(d) : d;
        return a.protocol === n.protocol && a.host === n.host;
      };
    }()
  ) : (
    // Non standard browser envs (web workers, react-native) lack needed support.
    function() {
      return function() {
        return !0;
      };
    }()
  ), co;
}
var fo, Mn;
function Xt() {
  if (Mn)
    return fo;
  Mn = 1;
  var e = wt, t = Ie;
  function o(r) {
    e.call(this, r ?? "canceled", e.ERR_CANCELED), this.name = "CanceledError";
  }
  return t.inherits(o, e, {
    __CANCEL__: !0
  }), fo = o, fo;
}
var po, On;
function Ta() {
  return On || (On = 1, po = function(t) {
    var o = /^([-+\w]{1,25})(:?\/\/|:)/.exec(t);
    return o && o[1] || "";
  }), po;
}
var ho, Fn;
function An() {
  if (Fn)
    return ho;
  Fn = 1;
  var e = Ie, t = _a(), o = ka(), r = Ir, n = Rr, l = Ia(), s = Ea(), d = $r, a = wt, i = Xt(), u = Ta();
  return ho = function(p) {
    return new Promise(function(y, w) {
      var k = p.data, F = p.headers, m = p.responseType, T;
      function O() {
        p.cancelToken && p.cancelToken.unsubscribe(T), p.signal && p.signal.removeEventListener("abort", T);
      }
      e.isFormData(k) && e.isStandardBrowserEnv() && delete F["Content-Type"];
      var N = new XMLHttpRequest();
      if (p.auth) {
        var E = p.auth.username || "", M = p.auth.password ? unescape(encodeURIComponent(p.auth.password)) : "";
        F.Authorization = "Basic " + btoa(E + ":" + M);
      }
      var K = n(p.baseURL, p.url);
      N.open(p.method.toUpperCase(), r(K, p.params, p.paramsSerializer), !0), N.timeout = p.timeout;
      function z() {
        if (N) {
          var ce = "getAllResponseHeaders" in N ? l(N.getAllResponseHeaders()) : null, ue = !m || m === "text" || m === "json" ? N.responseText : N.response, X = {
            data: ue,
            status: N.status,
            statusText: N.statusText,
            headers: ce,
            config: p,
            request: N
          };
          t(function(fe) {
            y(fe), O();
          }, function(fe) {
            w(fe), O();
          }, X), N = null;
        }
      }
      if ("onloadend" in N ? N.onloadend = z : N.onreadystatechange = function() {
        !N || N.readyState !== 4 || N.status === 0 && !(N.responseURL && N.responseURL.indexOf("file:") === 0) || setTimeout(z);
      }, N.onabort = function() {
        N && (w(new a("Request aborted", a.ECONNABORTED, p, N)), N = null);
      }, N.onerror = function() {
        w(new a("Network Error", a.ERR_NETWORK, p, N, N)), N = null;
      }, N.ontimeout = function() {
        var ue = p.timeout ? "timeout of " + p.timeout + "ms exceeded" : "timeout exceeded", X = p.transitional || d;
        p.timeoutErrorMessage && (ue = p.timeoutErrorMessage), w(new a(
          ue,
          X.clarifyTimeoutError ? a.ETIMEDOUT : a.ECONNABORTED,
          p,
          N
        )), N = null;
      }, e.isStandardBrowserEnv()) {
        var oe = (p.withCredentials || s(K)) && p.xsrfCookieName ? o.read(p.xsrfCookieName) : void 0;
        oe && (F[p.xsrfHeaderName] = oe);
      }
      "setRequestHeader" in N && e.forEach(F, function(ue, X) {
        typeof k > "u" && X.toLowerCase() === "content-type" ? delete F[X] : N.setRequestHeader(X, ue);
      }), e.isUndefined(p.withCredentials) || (N.withCredentials = !!p.withCredentials), m && m !== "json" && (N.responseType = p.responseType), typeof p.onDownloadProgress == "function" && N.addEventListener("progress", p.onDownloadProgress), typeof p.onUploadProgress == "function" && N.upload && N.upload.addEventListener("progress", p.onUploadProgress), (p.cancelToken || p.signal) && (T = function(ce) {
        N && (w(!ce || ce && ce.type ? new i() : ce), N.abort(), N = null);
      }, p.cancelToken && p.cancelToken.subscribe(T), p.signal && (p.signal.aborted ? T() : p.signal.addEventListener("abort", T))), k || (k = null);
      var ge = u(K);
      if (ge && ["http", "https", "file"].indexOf(ge) === -1) {
        w(new a("Unsupported protocol " + ge + ":", a.ERR_BAD_REQUEST, p));
        return;
      }
      N.send(k);
    });
  }, ho;
}
var mo, Bn;
function Pa() {
  return Bn || (Bn = 1, mo = null), mo;
}
var Ce = Ie, Un = ya, zn = wt, $a = $r, La = Lr, Ra = {
  "Content-Type": "application/x-www-form-urlencoded"
};
function qn(e, t) {
  !Ce.isUndefined(e) && Ce.isUndefined(e["Content-Type"]) && (e["Content-Type"] = t);
}
function Da() {
  var e;
  return (typeof XMLHttpRequest < "u" || typeof process < "u" && Object.prototype.toString.call(process) === "[object process]") && (e = An()), e;
}
function Va(e, t, o) {
  if (Ce.isString(e))
    try {
      return (t || JSON.parse)(e), Ce.trim(e);
    } catch (r) {
      if (r.name !== "SyntaxError")
        throw r;
    }
  return (o || JSON.stringify)(e);
}
var Zt = {
  transitional: $a,
  adapter: Da(),
  transformRequest: [function(t, o) {
    if (Un(o, "Accept"), Un(o, "Content-Type"), Ce.isFormData(t) || Ce.isArrayBuffer(t) || Ce.isBuffer(t) || Ce.isStream(t) || Ce.isFile(t) || Ce.isBlob(t))
      return t;
    if (Ce.isArrayBufferView(t))
      return t.buffer;
    if (Ce.isURLSearchParams(t))
      return qn(o, "application/x-www-form-urlencoded;charset=utf-8"), t.toString();
    var r = Ce.isObject(t), n = o && o["Content-Type"], l;
    if ((l = Ce.isFileList(t)) || r && n === "multipart/form-data") {
      var s = this.env && this.env.FormData;
      return La(l ? { "files[]": t } : t, s && new s());
    } else if (r || n === "application/json")
      return qn(o, "application/json"), Va(t);
    return t;
  }],
  transformResponse: [function(t) {
    var o = this.transitional || Zt.transitional, r = o && o.silentJSONParsing, n = o && o.forcedJSONParsing, l = !r && this.responseType === "json";
    if (l || n && Ce.isString(t) && t.length)
      try {
        return JSON.parse(t);
      } catch (s) {
        if (l)
          throw s.name === "SyntaxError" ? zn.from(s, zn.ERR_BAD_RESPONSE, this, null, this.response) : s;
      }
    return t;
  }],
  /**
   * A timeout in milliseconds to abort a request. If set to 0 (default) a
   * timeout is not created.
   */
  timeout: 0,
  xsrfCookieName: "XSRF-TOKEN",
  xsrfHeaderName: "X-XSRF-TOKEN",
  maxContentLength: -1,
  maxBodyLength: -1,
  env: {
    FormData: Pa()
  },
  validateStatus: function(t) {
    return t >= 200 && t < 300;
  },
  headers: {
    common: {
      Accept: "application/json, text/plain, */*"
    }
  }
};
Ce.forEach(["delete", "get", "head"], function(t) {
  Zt.headers[t] = {};
});
Ce.forEach(["post", "put", "patch"], function(t) {
  Zt.headers[t] = Ce.merge(Ra);
});
var nn = Zt, Ma = Ie, Oa = nn, Fa = function(t, o, r) {
  var n = this || Oa;
  return Ma.forEach(r, function(s) {
    t = s.call(n, t, o);
  }), t;
}, vo, jn;
function Dr() {
  return jn || (jn = 1, vo = function(t) {
    return !!(t && t.__CANCEL__);
  }), vo;
}
var Hn = Ie, go = Fa, Aa = Dr(), Ba = nn, Ua = Xt();
function wo(e) {
  if (e.cancelToken && e.cancelToken.throwIfRequested(), e.signal && e.signal.aborted)
    throw new Ua();
}
var za = function(t) {
  wo(t), t.headers = t.headers || {}, t.data = go.call(
    t,
    t.data,
    t.headers,
    t.transformRequest
  ), t.headers = Hn.merge(
    t.headers.common || {},
    t.headers[t.method] || {},
    t.headers
  ), Hn.forEach(
    ["delete", "get", "head", "post", "put", "patch", "common"],
    function(n) {
      delete t.headers[n];
    }
  );
  var o = t.adapter || Ba.adapter;
  return o(t).then(function(n) {
    return wo(t), n.data = go.call(
      t,
      n.data,
      n.headers,
      t.transformResponse
    ), n;
  }, function(n) {
    return Aa(n) || (wo(t), n && n.response && (n.response.data = go.call(
      t,
      n.response.data,
      n.response.headers,
      t.transformResponse
    ))), Promise.reject(n);
  });
}, Re = Ie, Vr = function(t, o) {
  o = o || {};
  var r = {};
  function n(u, f) {
    return Re.isPlainObject(u) && Re.isPlainObject(f) ? Re.merge(u, f) : Re.isPlainObject(f) ? Re.merge({}, f) : Re.isArray(f) ? f.slice() : f;
  }
  function l(u) {
    if (Re.isUndefined(o[u])) {
      if (!Re.isUndefined(t[u]))
        return n(void 0, t[u]);
    } else
      return n(t[u], o[u]);
  }
  function s(u) {
    if (!Re.isUndefined(o[u]))
      return n(void 0, o[u]);
  }
  function d(u) {
    if (Re.isUndefined(o[u])) {
      if (!Re.isUndefined(t[u]))
        return n(void 0, t[u]);
    } else
      return n(void 0, o[u]);
  }
  function a(u) {
    if (u in o)
      return n(t[u], o[u]);
    if (u in t)
      return n(void 0, t[u]);
  }
  var i = {
    url: s,
    method: s,
    data: s,
    baseURL: d,
    transformRequest: d,
    transformResponse: d,
    paramsSerializer: d,
    timeout: d,
    timeoutMessage: d,
    withCredentials: d,
    adapter: d,
    responseType: d,
    xsrfCookieName: d,
    xsrfHeaderName: d,
    onUploadProgress: d,
    onDownloadProgress: d,
    decompress: d,
    maxContentLength: d,
    maxBodyLength: d,
    beforeRedirect: d,
    transport: d,
    httpAgent: d,
    httpsAgent: d,
    cancelToken: d,
    socketPath: d,
    responseEncoding: d,
    validateStatus: a
  };
  return Re.forEach(Object.keys(t).concat(Object.keys(o)), function(f) {
    var p = i[f] || l, b = p(f);
    Re.isUndefined(b) && p !== a || (r[f] = b);
  }), r;
}, yo, Wn;
function Mr() {
  return Wn || (Wn = 1, yo = {
    version: "0.27.2"
  }), yo;
}
var qa = Mr().version, Ge = wt, rn = {};
["object", "boolean", "number", "function", "string", "symbol"].forEach(function(e, t) {
  rn[e] = function(r) {
    return typeof r === e || "a" + (t < 1 ? "n " : " ") + e;
  };
});
var Gn = {};
rn.transitional = function(t, o, r) {
  function n(l, s) {
    return "[Axios v" + qa + "] Transitional option '" + l + "'" + s + (r ? ". " + r : "");
  }
  return function(l, s, d) {
    if (t === !1)
      throw new Ge(
        n(s, " has been removed" + (o ? " in " + o : "")),
        Ge.ERR_DEPRECATED
      );
    return o && !Gn[s] && (Gn[s] = !0, console.warn(
      n(
        s,
        " has been deprecated since v" + o + " and will be removed in the near future"
      )
    )), t ? t(l, s, d) : !0;
  };
};
function ja(e, t, o) {
  if (typeof e != "object")
    throw new Ge("options must be an object", Ge.ERR_BAD_OPTION_VALUE);
  for (var r = Object.keys(e), n = r.length; n-- > 0; ) {
    var l = r[n], s = t[l];
    if (s) {
      var d = e[l], a = d === void 0 || s(d, l, e);
      if (a !== !0)
        throw new Ge("option " + l + " must be " + a, Ge.ERR_BAD_OPTION_VALUE);
      continue;
    }
    if (o !== !0)
      throw new Ge("Unknown option " + l, Ge.ERR_BAD_OPTION);
  }
}
var Ha = {
  assertOptions: ja,
  validators: rn
}, Or = Ie, Wa = Ir, Jn = ga, Yn = za, Qt = Vr, Ga = Rr, Fr = Ha, at = Fr.validators;
function vt(e) {
  this.defaults = e, this.interceptors = {
    request: new Jn(),
    response: new Jn()
  };
}
vt.prototype.request = function(t, o) {
  typeof t == "string" ? (o = o || {}, o.url = t) : o = t || {}, o = Qt(this.defaults, o), o.method ? o.method = o.method.toLowerCase() : this.defaults.method ? o.method = this.defaults.method.toLowerCase() : o.method = "get";
  var r = o.transitional;
  r !== void 0 && Fr.assertOptions(r, {
    silentJSONParsing: at.transitional(at.boolean),
    forcedJSONParsing: at.transitional(at.boolean),
    clarifyTimeoutError: at.transitional(at.boolean)
  }, !1);
  var n = [], l = !0;
  this.interceptors.request.forEach(function(b) {
    typeof b.runWhen == "function" && b.runWhen(o) === !1 || (l = l && b.synchronous, n.unshift(b.fulfilled, b.rejected));
  });
  var s = [];
  this.interceptors.response.forEach(function(b) {
    s.push(b.fulfilled, b.rejected);
  });
  var d;
  if (!l) {
    var a = [Yn, void 0];
    for (Array.prototype.unshift.apply(a, n), a = a.concat(s), d = Promise.resolve(o); a.length; )
      d = d.then(a.shift(), a.shift());
    return d;
  }
  for (var i = o; n.length; ) {
    var u = n.shift(), f = n.shift();
    try {
      i = u(i);
    } catch (p) {
      f(p);
      break;
    }
  }
  try {
    d = Yn(i);
  } catch (p) {
    return Promise.reject(p);
  }
  for (; s.length; )
    d = d.then(s.shift(), s.shift());
  return d;
};
vt.prototype.getUri = function(t) {
  t = Qt(this.defaults, t);
  var o = Ga(t.baseURL, t.url);
  return Wa(o, t.params, t.paramsSerializer);
};
Or.forEach(["delete", "get", "head", "options"], function(t) {
  vt.prototype[t] = function(o, r) {
    return this.request(Qt(r || {}, {
      method: t,
      url: o,
      data: (r || {}).data
    }));
  };
});
Or.forEach(["post", "put", "patch"], function(t) {
  function o(r) {
    return function(l, s, d) {
      return this.request(Qt(d || {}, {
        method: t,
        headers: r ? {
          "Content-Type": "multipart/form-data"
        } : {},
        url: l,
        data: s
      }));
    };
  }
  vt.prototype[t] = o(), vt.prototype[t + "Form"] = o(!0);
});
var Ja = vt, bo, Kn;
function Ya() {
  if (Kn)
    return bo;
  Kn = 1;
  var e = Xt();
  function t(o) {
    if (typeof o != "function")
      throw new TypeError("executor must be a function.");
    var r;
    this.promise = new Promise(function(s) {
      r = s;
    });
    var n = this;
    this.promise.then(function(l) {
      if (n._listeners) {
        var s, d = n._listeners.length;
        for (s = 0; s < d; s++)
          n._listeners[s](l);
        n._listeners = null;
      }
    }), this.promise.then = function(l) {
      var s, d = new Promise(function(a) {
        n.subscribe(a), s = a;
      }).then(l);
      return d.cancel = function() {
        n.unsubscribe(s);
      }, d;
    }, o(function(s) {
      n.reason || (n.reason = new e(s), r(n.reason));
    });
  }
  return t.prototype.throwIfRequested = function() {
    if (this.reason)
      throw this.reason;
  }, t.prototype.subscribe = function(r) {
    if (this.reason) {
      r(this.reason);
      return;
    }
    this._listeners ? this._listeners.push(r) : this._listeners = [r];
  }, t.prototype.unsubscribe = function(r) {
    if (this._listeners) {
      var n = this._listeners.indexOf(r);
      n !== -1 && this._listeners.splice(n, 1);
    }
  }, t.source = function() {
    var r, n = new t(function(s) {
      r = s;
    });
    return {
      token: n,
      cancel: r
    };
  }, bo = t, bo;
}
var _o, Xn;
function Ka() {
  return Xn || (Xn = 1, _o = function(t) {
    return function(r) {
      return t.apply(null, r);
    };
  }), _o;
}
var ko, Zn;
function Xa() {
  if (Zn)
    return ko;
  Zn = 1;
  var e = Ie;
  return ko = function(o) {
    return e.isObject(o) && o.isAxiosError === !0;
  }, ko;
}
var Qn = Ie, Za = Cr, At = Ja, Qa = Vr, ei = nn;
function Ar(e) {
  var t = new At(e), o = Za(At.prototype.request, t);
  return Qn.extend(o, At.prototype, t), Qn.extend(o, t), o.create = function(n) {
    return Ar(Qa(e, n));
  }, o;
}
var Le = Ar(ei);
Le.Axios = At;
Le.CanceledError = Xt();
Le.CancelToken = Ya();
Le.isCancel = Dr();
Le.VERSION = Mr().version;
Le.toFormData = Lr;
Le.AxiosError = wt;
Le.Cancel = Le.CanceledError;
Le.all = function(t) {
  return Promise.all(t);
};
Le.spread = Ka();
Le.isAxiosError = Xa();
Xo.exports = Le;
Xo.exports.default = Le;
var ti = Xo.exports, oi = ti;
const Br = /* @__PURE__ */ Js(oi), ni = {
  set(e, t) {
    sessionStorage && e != null && t != null && sessionStorage.setItem(e, t);
  },
  get(e) {
    return !sessionStorage || e == null ? null : sessionStorage.getItem(e);
  },
  setJSON(e, t) {
    t != null && this.set(e, JSON.stringify(t));
  },
  getJSON(e) {
    const t = this.get(e);
    if (t != null)
      return JSON.parse(t);
  }
}, xo = {
  /**
   * 会话级缓存
   */
  session: ni
}, eo = "Warm-", Ur = eo + "TokenName", zr = eo + "Framework";
function er(e) {
  return localStorage.getItem(eo + e);
}
function tr() {
  return localStorage.getItem(Ur);
}
function ri(e, t) {
  return localStorage.setItem(eo + e, t);
}
function li(e) {
  return localStorage.setItem(Ur, e);
}
function si(e) {
  return localStorage.setItem(zr, e);
}
function qr() {
  return localStorage.getItem(zr);
}
Br.defaults.headers["Content-Type"] = "application/json;charset=utf-8";
const De = Br.create({
  // axios中请求配置有baseURL选项，表示请求URL公共部分
  baseURL: "",
  // 超时
  timeout: 1e4
});
De.interceptors.request.use((e) => {
  const t = (e.headers || {}).repeatSubmit === !1;
  if (tr()) {
    let o = tr();
    if (o) {
      let r = o.split(",");
      for (let n = 0; n < r.length; n++)
        er(r[n]) && (e.headers[r[n]] = er(r[n]));
    }
  }
  if (e.method === "get" && e.params) {
    let o = e.url + "?" + Gs(e.params);
    o = o.slice(0, -1), e.params = {}, e.url = o;
  }
  if (!t && (e.method === "post" || e.method === "put")) {
    const o = {
      url: e.url,
      data: typeof e.data == "object" ? JSON.stringify(e.data) : e.data,
      time: (/* @__PURE__ */ new Date()).getTime()
    }, r = Object.keys(JSON.stringify(o)).length, n = 5 * 1024 * 1024;
    if (r >= n)
      return e;
    const l = xo.session.getJSON("sessionObj");
    if (l == null || l === "")
      xo.session.setJSON("sessionObj", o);
    else {
      const s = l.url, d = l.data, a = l.time, i = 1e3;
      if (d === o.data && o.time - a < i && s === o.url) {
        const u = "数据正在处理，请勿重复提交";
        return console.warn(`[${s}]: ` + u), Promise.reject(new Error(u));
      } else
        xo.session.setJSON("sessionObj", o);
    }
  }
  return e;
}, (e) => {
  Promise.reject(e);
});
De.interceptors.response.use(
  (e) => {
    const t = e.data.code || 200, o = e.data.msg;
    return e.request.responseType === "blob" || e.request.responseType === "arraybuffer" ? e.data : t !== 200 ? (ht().notify("error", { title: o }), Promise.reject(new Error(o))) : Promise.resolve(e.data);
  },
  (e) => {
    let { message: t } = e;
    return t == "Network Error" ? t = "后端接口连接异常" : t.includes("timeout") ? t = "系统接口请求超时" : t.includes("Request failed with status code") && (t = "系统接口" + t.substr(t.length - 3) + "异常"), ht().message("error", { message: t, duration: 5 * 1e3 }), Promise.reject(e);
  }
);
const Fe = "../";
function jr() {
  return {
    // ===== 流程定义（原 api/flow/definition.js） =====
    // 保存json流程定义
    saveJson(e, t) {
      return De({
        url: Fe + "warm-flow/save-json",
        method: "post",
        data: e,
        headers: { onlyNodeSkip: t }
      });
    },
    // 获取流程定义
    queryDef(e) {
      const t = e ? "/" + e : "";
      return De({
        url: Fe + "warm-flow/query-def" + t,
        method: "get"
      });
    },
    // 获取流程图
    queryFlowChart(e) {
      return De({
        url: Fe + "warm-flow/query-flow-chart/" + e,
        method: "get"
      });
    },
    // 办理人权限设置列表tabs页签
    handlerType() {
      return De({ url: Fe + "warm-flow/handler-type", method: "get" });
    },
    // 办理人权限设置列表结果
    handlerResult(e) {
      return De({ url: Fe + "warm-flow/handler-result", method: "get", params: e });
    },
    // 办理人权限名称回显
    handlerFeedback(e) {
      return De({ url: Fe + "warm-flow/handler-feedback", method: "get", params: e });
    },
    // 办理人选择项
    handlerDict() {
      return De({ url: Fe + "warm-flow/handler-dict", method: "get" });
    },
    // 查询已发布表单定义列表
    publishedList() {
      return De({ url: Fe + "warm-flow/published-form", method: "get" });
    },
    // 节点扩展属性
    nodeExt() {
      return De({ url: Fe + "warm-flow/node-ext", method: "get" });
    },
    // 获取监听器列表
    listenerList() {
      return De({ url: Fe + "warm-flow/listener-list", method: "get" });
    },
    // ===== 匿名 / 配置（原 api/anony.js） =====
    // 获取设计器配置
    config() {
      return De({ url: Fe + "warm-flow-ui/config", method: "get" });
    }
  };
}
let Hr = jr();
function ai(e) {
  Hr = Object.assign(jr(), e || {});
}
function Ye() {
  return Hr;
}
function ii(e, t) {
  return Ye().saveJson(e, t);
}
function di(e) {
  return Ye().queryDef(e);
}
function ui() {
  return Ye().handlerType();
}
function ci(e) {
  return Ye().handlerResult(e);
}
function ln(e) {
  return Ye().handlerFeedback(e);
}
function fi() {
  return Ye().nodeExt();
}
function Wr() {
  return Ye().listenerList();
}
function pi(e, t) {
  const { t: o } = xe(), r = D(null), n = D(null), l = D(""), s = D([]), d = D(!0), a = D(0), i = D([]), u = D(""), f = D(void 0), p = D(window.innerWidth <= 768), b = 10, y = D(!1), w = D(!1), k = D([]), F = D([
    { key: 0, label: o("between.handlerStorageId"), visible: !0 },
    { key: 1, label: o("selectUser.permCode"), visible: !0 },
    { key: 2, label: o("between.handlerName"), visible: !0 },
    { key: 3, label: o("selectUser.permGroup"), visible: !0 },
    { key: 4, label: o("selectUser.createTime"), visible: !0 }
  ]), m = D([]), T = zo({
    queryParams: {
      pageNum: 1,
      pageSize: 10,
      userName: void 0,
      status: "0",
      groupId: void 0
    },
    checkAllInfo: {
      isIndeterminate: !1,
      isChecked: !1
    }
  }), { queryParams: O, checkAllInfo: N } = dl(T);
  de(u, (S) => {
    var W;
    (W = r.value) == null || W.filter(S);
  }), de(() => e.selectUser, (S, W) => {
    W ? et(() => {
      m.value = m.value.filter((Q) => {
        let ee = S ? S.findIndex((B) => B === Q.storageId) : -1;
        return s.value.forEach((B) => {
          B.storageId === Q.storageId && (B.isChecked = ee !== -1);
        }), ee !== -1;
      });
    }) : m.value = S ? e.permissionRows.filter((Q) => Q.storageId) : [];
  }, { deep: !0, immediate: !0 });
  function E() {
    ui().then((S) => {
      k.value = S.data, S.data && S.data.length > 0 && (l.value = S.data[0]), window.innerWidth <= 768 && !O.value.pageSize && (O.value.pageSize = b, O.value.pageNum = 1), M();
    }).catch(() => {
      d.value = !1, y.value = !1;
    });
  }
  function M(S = !1) {
    if (S ? y.value = !0 : d.value = !0, !l.value) {
      d.value = !1, y.value = !1;
      return;
    }
    O.value.handlerType = l.value, i.value = Array.isArray(i.value) ? i.value : [], O.value.beginTime = i.value[0], O.value.endTime = i.value[1], ci(O.value).then((W) => {
      d.value = !1, y.value = !1;
      let Q = W.data.handlerAuths;
      Q.rows.forEach((ee) => {
        ee.isChecked = m.value.findIndex((B) => B.storageId === ee.storageId) !== -1;
      }), S && window.innerWidth <= 768 ? s.value = [...s.value, ...Q.rows] : s.value = Q.rows, a.value = Q.total, f.value = W.data.treeSelections, et(() => {
        var ee;
        u.value && ((ee = r.value) == null || ee.filter(u.value));
      }), we();
    }).catch(() => {
      d.value = !1, y.value = !1;
    });
  }
  function K() {
    if (!(y.value || w.value || d.value)) {
      if (s.value.length >= a.value) {
        w.value = !0;
        return;
      }
      O.value.pageNum++, O.value.pageSize = b, M(!0);
    }
  }
  function z(S) {
    const W = S.target;
    W && W.scrollTop + W.clientHeight >= W.scrollHeight - 60 && K();
  }
  function oe() {
    y.value = !1, w.value = !1, O.value.pageNum = 1, window.innerWidth <= 768 && (O.value.pageSize = b);
  }
  function ge(S) {
    O.value.groupId = S.id, ue();
  }
  function ce() {
    O.value.groupId = void 0, X();
  }
  function ue() {
    oe(), M();
  }
  function X() {
    var S, W;
    i.value = [], u.value = "", (S = n.value) == null || S.resetFields(), O.value.groupId = void 0, (W = r.value) == null || W.setCurrentKey(null), ue();
  }
  function we() {
    const S = s.value.length;
    let W = 0;
    s.value.map((Q) => {
      Q.isChecked && (W += 1);
    }), N.value.isChecked = S === W && S > 0, N.value.isIndeterminate = W > 0 && W < S;
  }
  function fe() {
    const S = m.value;
    N.value.isIndeterminate = !1, N.value.isChecked ? s.value = s.value.map((W) => (W.isChecked = !0, m.value.findIndex((Q) => Q.storageId === W.storageId) === -1 && S.push({ storageId: W.storageId, handlerName: W.handlerName }), W)) : s.value = s.value.map((W) => {
      W.isChecked = !1;
      let Q = S.findIndex((ee) => ee.storageId === W.storageId);
      return Q !== -1 && S.splice(Q, 1), W;
    }), m.value = S;
  }
  function P(S) {
    s.value.forEach((Q) => {
      Q.storageId === S.storageId && (Q.isChecked = !Q.isChecked);
    });
    const W = [...m.value];
    if (S.isChecked)
      W.findIndex((Q) => Q.storageId === S.storageId) === -1 && W.push({ storageId: S.storageId, handlerName: S.handlerName });
    else {
      const Q = W.findIndex((ee) => ee.storageId === S.storageId);
      Q !== -1 && W.splice(Q, 1);
    }
    m.value = W, we();
  }
  function H(S) {
    s.value.forEach((ee) => {
      ee.storageId === S && (ee.isChecked = !ee.isChecked);
    });
    const W = m.value, Q = W.findIndex((ee) => ee.storageId === S);
    Q !== -1 && W.splice(Q, 1), m.value = W, we();
  }
  function se() {
    s.value.forEach((S) => {
      S.isChecked = !1;
    }), m.value = [], N.value.isChecked = !1, N.value.isIndeterminate = !1;
  }
  function I() {
    t("update:userVisible", !1);
  }
  function Z() {
    t("handleUserSelect", m.value), I();
  }
  return E(), {
    // 模板 ref
    groupTreeRef: r,
    queryRef: n,
    // state
    tabsValue: l,
    tableList: s,
    loading: d,
    total: a,
    dateRange: i,
    groupName: u,
    groupOptions: f,
    treeCollapsed: p,
    mobileLoadingMore: y,
    mobileNoMore: w,
    tabsList: k,
    columns: F,
    checkedItemList: m,
    queryParams: O,
    checkAllInfo: N,
    // methods（模板事件）
    getList: M,
    onMobileScroll: z,
    handleNodeClick: ge,
    tabChange: ce,
    handleQuery: ue,
    resetQuery: X,
    handleCheckAll: fe,
    handleCheck: P,
    handleClose: H,
    clearAllSelected: se,
    submitForm: Z
  };
}
const Gr = (e) => (ot("data-v-1209f35f"), e = e(), nt(), e), hi = /* @__PURE__ */ Gr(() => /* @__PURE__ */ v("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  class: "tree-icon"
}, [
  /* @__PURE__ */ v("path", {
    d: "M15 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L15 2ZM18 20H6V4H14V9H18V20ZM8.5 12H10V17H8.5V12ZM11 12H12.5V17H11V12ZM13.5 12H15V17H13.5V12Z",
    fill: "currentColor"
  })
], -1)), mi = { class: "tree-collapse-toggle" }, vi = /* @__PURE__ */ Gr(() => /* @__PURE__ */ v("path", {
  d: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  fill: "currentColor"
}, null, -1)), gi = [
  vi
], wi = { class: "tree-content" }, yi = { class: "tree-search" }, bi = { class: "tree-body" }, _i = /* @__PURE__ */ be({
  name: "UserPickerTree",
  __name: "UserPickerTree",
  props: {
    groupOptions: { default: void 0 },
    groupName: { default: "" },
    treeCollapsed: { type: Boolean, default: !1 }
  },
  emits: ["update:groupName", "update:treeCollapsed", "node-click"],
  setup(e, { expose: t, emit: o }) {
    const { t: r } = xe(), n = e, l = o, s = D(null), d = le({
      get: () => n.groupName,
      set: (f) => l("update:groupName", f)
    });
    function a() {
      l("update:treeCollapsed", !n.treeCollapsed);
    }
    const i = (f, p) => f ? p.name.indexOf(f) !== -1 : !0;
    function u(f) {
      l("node-click", f);
    }
    return t({
      filter: (f) => {
        var p;
        return (p = s.value) == null ? void 0 : p.filter(f);
      },
      setCurrentKey: (f) => {
        var p;
        return (p = s.value) == null ? void 0 : p.setCurrentKey(f);
      }
    }), (f, p) => {
      const b = L("svg-icon"), y = L("wf-input"), w = L("wf-tree");
      return _(), V("div", {
        class: _e(["section-card tree-card", { "tree-collapsed": f.treeCollapsed }])
      }, [
        v("div", {
          class: "tree-header tree-header-clickable",
          onClick: a
        }, [
          hi,
          v("span", null, A(c(r)("selectUser.orgTree")), 1),
          v("span", mi, [
            (_(), V("svg", {
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              class: _e(["toggle-arrow", { "is-expanded": !f.treeCollapsed }])
            }, gi, 2))
          ])
        ]),
        h(ar, { name: "tree-slide" }, {
          default: g(() => [
            ke(v("div", wi, [
              v("div", yi, [
                h(y, {
                  modelValue: d.value,
                  "onUpdate:modelValue": p[0] || (p[0] = (k) => d.value = k),
                  placeholder: c(r)("selectUser.searchDept"),
                  clearable: "",
                  size: "default"
                }, {
                  prefix: g(() => [
                    h(b, { "icon-class": "ep:search" })
                  ]),
                  _: 1
                }, 8, ["modelValue", "placeholder"])
              ]),
              v("div", bi, [
                h(w, {
                  data: f.groupOptions,
                  props: { label: "name", children: "children" },
                  "expand-on-click-node": !1,
                  "filter-node-method": i,
                  ref_key: "treeRef",
                  ref: s,
                  "node-key": "id",
                  "highlight-current": "",
                  "default-expand-all": "",
                  onNodeClick: u
                }, null, 8, ["data"])
              ])
            ], 512), [
              [Ne, !f.treeCollapsed]
            ])
          ]),
          _: 1
        })
      ], 2);
    };
  }
}), ki = /* @__PURE__ */ Ee(_i, [["__scopeId", "data-v-1209f35f"]]), xi = (e) => (ot("data-v-41115ea9"), e = e(), nt(), e), Ci = {
  key: 0,
  class: "selected-inline-bar"
}, Si = /* @__PURE__ */ xi(() => /* @__PURE__ */ v("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  class: "bar-icon"
}, [
  /* @__PURE__ */ v("path", {
    d: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z",
    fill: "currentColor"
  })
], -1)), Ni = {
  key: 0,
  class: "selected-mini-tags"
}, Ii = {
  key: 1,
  class: "selected-mini-tags selected-overflow"
}, Ei = { class: "tooltip-tag-list" }, or = 8, Ti = /* @__PURE__ */ be({
  name: "UserPickerSelectedBar",
  __name: "UserPickerSelectedBar",
  props: {
    selected: { default: () => [] }
  },
  emits: ["close", "clear"],
  setup(e, { emit: t }) {
    const { t: o } = xe(), r = e, n = t, l = le(() => r.selected.slice(0, or));
    function s(a) {
      n("close", a);
    }
    function d() {
      n("clear");
    }
    return (a, i) => {
      const u = L("wf-tag"), f = L("wf-tooltip"), p = L("wf-button");
      return a.selected.length > 0 ? (_(), V("div", Ci, [
        Si,
        v("span", null, [
          Se(A(c(o)("selectUser.selectedPrefix")) + " ", 1),
          v("strong", null, A(a.selected.length), 1),
          Se(" " + A(c(o)("selectUser.selectedUnit")), 1)
        ]),
        a.selected.length <= 8 ? (_(), V("div", Ni, [
          (_(!0), V(ve, null, ye(a.selected, (b) => (_(), Y(u, {
            closable: "",
            key: b.storageId,
            onClose: (y) => s(b.storageId),
            class: "mini-tag",
            size: "small"
          }, {
            default: g(() => [
              Se(A(b.handlerName || b.storageId), 1)
            ]),
            _: 2
          }, 1032, ["onClose"]))), 128))
        ])) : (_(), V("div", Ii, [
          (_(!0), V(ve, null, ye(l.value, (b) => (_(), Y(u, {
            closable: "",
            key: b.storageId,
            onClose: (y) => s(b.storageId),
            class: "mini-tag",
            size: "small"
          }, {
            default: g(() => [
              Se(A(b.handlerName || b.storageId), 1)
            ]),
            _: 2
          }, 1032, ["onClose"]))), 128)),
          h(f, {
            placement: "top",
            effect: "light",
            offset: 8,
            "popper-class": "selected-all-tooltip"
          }, {
            content: g(() => [
              v("div", Ei, [
                (_(!0), V(ve, null, ye(a.selected, (b) => (_(), V("div", {
                  class: "tooltip-item",
                  key: b.storageId
                }, A(b.handlerName || b.storageId), 1))), 128))
              ])
            ]),
            default: g(() => [
              h(u, {
                class: "mini-tag more-tag",
                size: "small"
              }, {
                default: g(() => [
                  Se("+" + A(a.selected.length - or) + " " + A(c(o)("selectUser.more")), 1)
                ]),
                _: 1
              })
            ]),
            _: 1
          })
        ])),
        h(p, {
          link: "",
          type: "danger",
          size: "small",
          class: "clear-all-btn",
          onClick: d
        }, {
          default: g(() => [
            Se(A(c(o)("selectUser.clear")), 1)
          ]),
          _: 1
        })
      ])) : j("", !0);
    };
  }
}), Pi = /* @__PURE__ */ Ee(Ti, [["__scopeId", "data-v-41115ea9"]]), Jr = (e) => (ot("data-v-04ddfad4"), e = e(), nt(), e), $i = { class: "search-toggle-row mobile-only" }, Li = /* @__PURE__ */ Jr(() => /* @__PURE__ */ v("svg", {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg",
  class: "search-icon"
}, [
  /* @__PURE__ */ v("path", {
    d: "M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z",
    fill: "currentColor"
  })
], -1)), Ri = /* @__PURE__ */ Jr(() => /* @__PURE__ */ v("path", {
  d: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
  fill: "currentColor"
}, null, -1)), Di = [
  Ri
], Vi = { class: "section-card search-card" }, Mi = { class: "search-card-body" }, Oi = { class: "search-action-row" }, Fi = { class: "search-action-left" }, Ai = /* @__PURE__ */ be({
  name: "UserPickerSearch",
  __name: "UserPickerSearch",
  props: {
    queryParams: { default: () => ({}) },
    dateRange: { default: () => [] }
  },
  emits: ["update:dateRange", "query", "reset", "confirm"],
  setup(e, { expose: t, emit: o }) {
    const { t: r } = xe(), n = e, l = o, s = D(null), d = D(!0), a = D(window.innerWidth <= 768), i = le({
      get: () => n.dateRange,
      set: (b) => l("update:dateRange", b)
    });
    function u() {
      l("query");
    }
    function f() {
      l("reset");
    }
    function p() {
      l("confirm");
    }
    return t({
      resetFields: () => {
        var b;
        return (b = s.value) == null ? void 0 : b.resetFields();
      }
    }), (b, y) => {
      const w = L("wf-input"), k = L("wf-form-item"), F = L("wf-date-picker"), m = L("wf-form");
      return _(), V(ve, null, [
        v("div", $i, [
          v("button", {
            class: _e(["search-toggle-btn", { "is-expanded": !a.value }]),
            onClick: y[0] || (y[0] = (T) => a.value = !a.value)
          }, [
            Li,
            v("span", null, A(a.value ? c(r)("selectUser.filter") : c(r)("selectUser.filterExpanded")), 1),
            (_(), V("svg", {
              viewBox: "0 0 24 24",
              fill: "none",
              xmlns: "http://www.w3.org/2000/svg",
              class: _e(["toggle-arrow-sm", { "is-rotated": !a.value }])
            }, Di, 2))
          ], 2),
          v("button", {
            class: "btn-confirm btn-confirm-inline mobile-only",
            onClick: p
          }, A(c(r)("common.confirm")), 1)
        ]),
        ke(v("div", Vi, [
          v("div", Mi, [
            h(m, {
              model: b.queryParams,
              ref_key: "queryRef",
              ref: s,
              inline: !0,
              "label-width": "88px"
            }, {
              default: g(() => [
                h(k, {
                  label: c(r)("selectUser.permCode"),
                  prop: "handlerCode"
                }, {
                  default: g(() => [
                    h(w, {
                      modelValue: b.queryParams.handlerCode,
                      "onUpdate:modelValue": y[1] || (y[1] = (T) => b.queryParams.handlerCode = T),
                      placeholder: c(r)("selectUser.permCodePlaceholder"),
                      clearable: "",
                      style: { width: "200px" },
                      onKeyup: vn(u, ["enter"])
                    }, null, 8, ["modelValue", "placeholder", "onKeyup"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                h(k, {
                  label: c(r)("between.handlerName"),
                  prop: "handlerName"
                }, {
                  default: g(() => [
                    h(w, {
                      modelValue: b.queryParams.handlerName,
                      "onUpdate:modelValue": y[2] || (y[2] = (T) => b.queryParams.handlerName = T),
                      placeholder: c(r)("selectUser.permNamePlaceholder"),
                      clearable: "",
                      style: { width: "200px" },
                      onKeyup: vn(u, ["enter"])
                    }, null, 8, ["modelValue", "placeholder", "onKeyup"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                h(k, {
                  label: c(r)("selectUser.createTime")
                }, {
                  default: g(() => [
                    h(F, {
                      modelValue: i.value,
                      "onUpdate:modelValue": y[3] || (y[3] = (T) => i.value = T),
                      "value-format": "YYYY-MM-DD",
                      type: "daterange",
                      "range-separator": "-",
                      "start-placeholder": c(r)("selectUser.startDate"),
                      "end-placeholder": c(r)("selectUser.endDate")
                    }, null, 8, ["modelValue", "start-placeholder", "end-placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"])
              ]),
              _: 1
            }, 8, ["model"]),
            v("div", Oi, [
              v("div", Fi, [
                v("button", {
                  type: "button",
                  class: "btn-action btn-primary",
                  onClick: u
                }, A(c(r)("common.search")), 1),
                v("button", {
                  type: "button",
                  class: "btn-action btn-default",
                  onClick: f
                }, A(c(r)("common.reset")), 1)
              ]),
              v("button", {
                class: "btn-confirm btn-confirm-search",
                onClick: p
              }, A(c(r)("common.confirm")), 1)
            ])
          ])
        ], 512), [
          [Ne, d.value && !a.value]
        ])
      ], 64);
    };
  }
}), Bi = /* @__PURE__ */ Ee(Ai, [["__scopeId", "data-v-04ddfad4"]]), Yr = (e) => (ot("data-v-cfb80d78"), e = e(), nt(), e), Ui = { class: "user-select-wrapper" }, zi = {
  key: 0,
  class: "modern-tabs-wrapper"
}, qi = { class: "modern-tabs" }, ji = ["onClick"], Hi = { class: "tab-label" }, Wi = ["onClick"], Gi = { class: "card-left" }, Ji = { class: "card-info" }, Yi = { class: "card-name-row" }, Ki = { class: "card-name" }, Xi = {
  key: 0,
  class: "card-time"
}, Zi = { class: "card-sub" }, Qi = { class: "card-code" }, ed = {
  key: 0,
  class: "card-group"
}, td = {
  key: 0,
  class: "card-check-icon"
}, od = /* @__PURE__ */ Yr(() => /* @__PURE__ */ v("svg", {
  viewBox: "0 0 24 24",
  fill: "none"
}, [
  /* @__PURE__ */ v("path", {
    d: "M9 16.2L4.8 12l-1.4 1.4L9 19 21 7l-1.4-1.4L9 16.2z",
    fill: "#67c23a"
  })
], -1)), nd = [
  od
], rd = { class: "mobile-load-more" }, ld = {
  key: 0,
  class: "load-text"
}, sd = {
  key: 1,
  class: "load-text load-end"
}, ad = {
  key: 0,
  class: "mobile-empty"
}, id = { class: "section-card table-card pc-only" }, dd = { class: "user-empty" }, ud = /* @__PURE__ */ Yr(() => /* @__PURE__ */ v("svg", {
  viewBox: "0 0 24 24",
  class: "user-empty-icon"
}, [
  /* @__PURE__ */ v("path", {
    d: "M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z",
    fill: "currentColor"
  })
], -1)), cd = { class: "table-footer" }, fd = /* @__PURE__ */ be({
  name: "User",
  __name: "selectUser",
  props: {
    userVisible: { type: Boolean, default: !1 },
    selectUser: { default: () => [] },
    permissionRows: { default: () => [] }
  },
  emits: ["update:userVisible", "handleUserSelect"],
  setup(e, { emit: t }) {
    const { t: o } = xe(), r = e, n = t, {
      // 模板 ref
      groupTreeRef: l,
      queryRef: s,
      // state
      tabsValue: d,
      tableList: a,
      loading: i,
      total: u,
      dateRange: f,
      groupName: p,
      groupOptions: b,
      treeCollapsed: y,
      mobileLoadingMore: w,
      mobileNoMore: k,
      tabsList: F,
      columns: m,
      checkedItemList: T,
      queryParams: O,
      checkAllInfo: N,
      // methods（模板事件）
      getList: E,
      onMobileScroll: M,
      handleNodeClick: K,
      tabChange: z,
      handleQuery: oe,
      resetQuery: ge,
      handleCheckAll: ce,
      handleCheck: ue,
      handleClose: X,
      clearAllSelected: we,
      submitForm: fe
    } = pi(r, n);
    return (P, H) => {
      const se = L("wf-col"), I = L("wf-checkbox"), Z = L("wf-table-column"), S = L("wf-table"), W = L("wf-pagination"), Q = L("wf-row"), ee = ir("loading");
      return _(), V("div", Ui, [
        c(F).length > 0 ? (_(), V("div", zi, [
          v("div", qi, [
            (_(!0), V(ve, null, ye(c(F), (B) => (_(), V("div", {
              key: B,
              class: _e(["modern-tab-item", { "is-active": c(d) === B }]),
              onClick: ($) => {
                d.value = B, c(z)();
              }
            }, [
              v("span", Hi, A(B), 1)
            ], 10, ji))), 128))
          ])
        ])) : j("", !0),
        h(Q, {
          gutter: 16,
          class: "content"
        }, {
          default: g(() => [
            ke(h(se, {
              span: 5,
              xs: 24
            }, {
              default: g(() => [
                h(ki, {
                  ref_key: "groupTreeRef",
                  ref: l,
                  "group-options": c(b),
                  "group-name": c(p),
                  "onUpdate:groupName": H[0] || (H[0] = (B) => ro(p) ? p.value = B : null),
                  "tree-collapsed": c(y),
                  "onUpdate:treeCollapsed": H[1] || (H[1] = (B) => ro(y) ? y.value = B : null),
                  onNodeClick: c(K)
                }, null, 8, ["group-options", "group-name", "tree-collapsed", "onNodeClick"])
              ]),
              _: 1
            }, 512), [
              [Ne, c(b)]
            ]),
            h(se, {
              span: c(b) ? 19 : 24,
              xs: 24
            }, {
              default: g(() => [
                h(Bi, {
                  ref_key: "queryRef",
                  ref: s,
                  "query-params": c(O),
                  "date-range": c(f),
                  "onUpdate:dateRange": H[2] || (H[2] = (B) => ro(f) ? f.value = B : null),
                  onQuery: c(oe),
                  onReset: c(ge),
                  onConfirm: c(fe)
                }, null, 8, ["query-params", "date-range", "onQuery", "onReset", "onConfirm"]),
                h(Pi, {
                  selected: c(T),
                  onClose: c(X),
                  onClear: c(we)
                }, null, 8, ["selected", "onClose", "onClear"]),
                ke((_(), V("div", {
                  class: "mobile-card-list mobile-only",
                  onScroll: H[3] || (H[3] = //@ts-ignore
                  (...B) => c(M) && c(M)(...B))
                }, [
                  (_(!0), V(ve, null, ye(c(a), (B) => (_(), V("div", {
                    key: B.storageId,
                    class: _e(["mobile-card-item", { "is-checked": B.isChecked }]),
                    onClick: ($) => c(ue)(B)
                  }, [
                    v("div", Gi, [
                      h(I, {
                        "model-value": B.isChecked,
                        onChange: dr(($) => c(ue)(B), ["stop"])
                      }, null, 8, ["model-value", "onChange"]),
                      v("div", Ji, [
                        v("div", Yi, [
                          v("span", Ki, A(B.handlerName || "-"), 1),
                          B.createTime ? (_(), V("span", Xi, A(B.createTime), 1)) : j("", !0)
                        ]),
                        v("div", Zi, [
                          v("span", Qi, A(B.handlerCode || "-"), 1),
                          B.groupName ? (_(), V("span", ed, A(B.groupName), 1)) : j("", !0)
                        ])
                      ])
                    ]),
                    B.isChecked ? (_(), V("div", td, nd)) : j("", !0)
                  ], 10, Wi))), 128)),
                  v("div", rd, [
                    c(a).length > 0 ? (_(), V(ve, { key: 0 }, [
                      c(w) ? (_(), V("span", ld, A(c(o)("selectUser.loadingMore")), 1)) : c(k) || c(a).length >= c(u).value ? (_(), V("span", sd, A(c(o)("selectUser.loadedAll")), 1)) : j("", !0)
                    ], 64)) : j("", !0)
                  ]),
                  !c(i) && c(a).length === 0 ? (_(), V("div", ad, A(c(o)("common.empty")), 1)) : j("", !0)
                ], 32)), [
                  [ee, c(i)]
                ]),
                v("div", id, [
                  ke((_(), Y(S, {
                    data: c(a),
                    "max-height": 570,
                    onRowClick: c(ue)
                  }, {
                    empty: g(() => [
                      v("div", dd, [
                        ud,
                        v("span", null, A(c(o)("selectUser.emptyUsers")), 1)
                      ])
                    ]),
                    default: g(() => [
                      h(Z, {
                        width: "50",
                        align: "center"
                      }, {
                        header: g(() => [
                          h(I, {
                            modelValue: c(N).isChecked,
                            "onUpdate:modelValue": H[4] || (H[4] = (B) => c(N).isChecked = B),
                            indeterminate: c(N).isIndeterminate,
                            onChange: c(ce)
                          }, null, 8, ["modelValue", "indeterminate", "onChange"])
                        ]),
                        default: g((B) => [
                          h(I, {
                            "model-value": B.row.isChecked
                          }, null, 8, ["model-value"])
                        ]),
                        _: 1
                      }),
                      c(m)[2].visible ? (_(), Y(Z, {
                        label: c(o)("between.handlerName"),
                        align: "center",
                        key: "handlerName",
                        prop: "handlerName",
                        "show-overflow-tooltip": !0
                      }, null, 8, ["label"])) : j("", !0),
                      c(m)[1].visible ? (_(), Y(Z, {
                        label: c(o)("selectUser.permCode"),
                        align: "center",
                        key: "handlerCode",
                        prop: "handlerCode",
                        "show-overflow-tooltip": !0
                      }, null, 8, ["label"])) : j("", !0),
                      c(m)[0].visible ? (_(), Y(Z, {
                        label: c(o)("between.handlerStorageId"),
                        align: "center",
                        key: "storageId",
                        prop: "storageId",
                        "class-name": "mobile-hide-col"
                      }, null, 8, ["label"])) : j("", !0),
                      c(m)[3].visible ? (_(), Y(Z, {
                        label: c(o)("selectUser.permGroup"),
                        align: "center",
                        key: "groupName",
                        prop: "groupName",
                        "show-overflow-tooltip": !0,
                        "class-name": "mobile-hide-col"
                      }, null, 8, ["label"])) : j("", !0),
                      c(m)[4].visible ? (_(), Y(Z, {
                        key: 4,
                        label: c(o)("selectUser.createTime"),
                        align: "center",
                        prop: "createTime",
                        width: "160",
                        "class-name": "mobile-hide-col"
                      }, {
                        default: g((B) => [
                          v("span", null, A(c(Ws)(B.row.createTime)), 1)
                        ]),
                        _: 1
                      }, 8, ["label"])) : j("", !0)
                    ]),
                    _: 1
                  }, 8, ["data", "onRowClick"])), [
                    [ee, c(i)]
                  ]),
                  v("div", cd, [
                    ke(h(W, {
                      "current-page": c(O).pageNum,
                      "onUpdate:currentPage": H[5] || (H[5] = (B) => c(O).pageNum = B),
                      "page-size": c(O).pageSize,
                      "onUpdate:pageSize": H[6] || (H[6] = (B) => c(O).pageSize = B),
                      total: c(u),
                      small: "",
                      onSizeChange: c(E),
                      onCurrentChange: c(E)
                    }, null, 8, ["current-page", "page-size", "total", "onSizeChange", "onCurrentChange"]), [
                      [Ne, c(u) > 0]
                    ])
                  ])
                ])
              ]),
              _: 1
            }, 8, ["span"])
          ]),
          _: 1
        })
      ]);
    };
  }
}), Kr = /* @__PURE__ */ Ee(fd, [["__scopeId", "data-v-cfb80d78"]]), pd = (e) => (ot("data-v-31c5baed"), e = e(), nt(), e), hd = /* @__PURE__ */ pd(() => /* @__PURE__ */ v("span", null, "：", -1)), md = { key: 3 }, vd = { key: 4 }, gd = { class: "el-tag__content" }, wd = ["onClick"], yd = { key: 6 }, bd = /* @__PURE__ */ be({
  name: "NodeExtList",
  __name: "nodeExtList",
  props: {
    modelValue: { default: () => ({}) },
    formList: { default: () => [] },
    disabled: { type: Boolean, default: !1 }
  },
  setup(e, { expose: t }) {
    const { proxy: o } = tt(), { t: r } = xe(), n = e, l = D(n.modelValue), s = D(!1), d = D({}), a = D("");
    async function i() {
      let w = null;
      return await o.$refs.nodeExtRef.validate((k) => {
        w = k;
      }), w;
    }
    function u(w) {
      a.value = w, s.value = !0;
    }
    function f(w, k) {
      l.value[k] = w.map((F) => F.storageId).filter((F) => F), d.value[k] = w;
    }
    function p(w, k) {
      d.value[w] && d.value[w].length > 0 && (d.value[w] = d.value[w].filter((F) => F.storageId !== k.storageId), l.value[w] = d.value[w].map((F) => F.storageId).filter((F) => F));
    }
    function b() {
      const w = /* @__PURE__ */ new Map();
      n.formList.forEach((k) => {
        w.set(k.code, k);
      });
      for (let k in l.value)
        l.value[k] && l.value[k].length > 0 && w.get(k) && w.get(k).type === 5 && (ln({ storageIds: l.value[k] }).then((F) => {
          F.code === 200 && F.data && (d.value[k] = F.data);
        }), d.value[k] = l.value[k]);
    }
    function y() {
      n.formList.forEach((w) => {
        const k = l.value[w.code];
        if (k != null && k !== "" && k !== "null" && k !== "undefined" && w.type === 6) {
          const F = Number(k);
          isNaN(F) || (l.value[w.code] = F);
        }
      });
    }
    return y(), b(), t({
      validate: i
    }), (w, k) => {
      const F = L("svg-icon"), m = L("wf-icon"), T = L("wf-tooltip"), O = L("wf-input"), N = L("wf-option"), E = L("wf-select"), M = L("wf-radio"), K = L("wf-col"), z = L("wf-row"), oe = L("wf-radio-group"), ge = L("wf-checkbox"), ce = L("wf-checkbox-group"), ue = L("wf-button"), X = L("wf-input-number"), we = L("wf-time-picker"), fe = L("wf-date-picker"), P = L("wf-form-item"), H = L("wf-form"), se = L("wf-dialog");
      return _(), V(ve, null, [
        h(H, {
          ref: "nodeExtRef",
          class: "nodeExtForm",
          model: l.value,
          "label-width": "140px",
          size: "small",
          disabled: w.disabled,
          "label-position": "left"
        }, {
          default: g(() => [
            (_(!0), V(ve, null, ye(w.formList, (I, Z) => (_(), Y(P, {
              label: `${I.label}：`,
              prop: I.code,
              key: Z,
              rules: [{ required: I.must, message: c(r)("nodeExtList.required", { label: I.label }), trigger: ["blur", "change"] }]
            }, {
              label: g(() => [
                v("span", null, A(I.label), 1),
                [4, 5].includes(I.type) ? (_(), Y(T, {
                  key: 0,
                  effect: "dark",
                  content: I.desc
                }, {
                  default: g(() => [
                    h(m, {
                      size: 14,
                      style: { "margin-left": "2px", "margin-top": "4px" }
                    }, {
                      default: g(() => [
                        h(F, { "icon-class": "ep:warning-filled" })
                      ]),
                      _: 1
                    })
                  ]),
                  _: 2
                }, 1032, ["content"])) : j("", !0),
                hd
              ]),
              default: g(() => [
                I.type === 1 ? (_(), Y(O, {
                  key: 0,
                  modelValue: l.value[I.code],
                  "onUpdate:modelValue": (S) => l.value[I.code] = S,
                  placeholder: I.desc
                }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])) : I.type === 2 ? (_(), Y(O, {
                  key: 1,
                  modelValue: l.value[I.code],
                  "onUpdate:modelValue": (S) => l.value[I.code] = S,
                  rows: 2,
                  type: "textarea",
                  placeholder: I.desc
                }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder"])) : I.type === 3 ? (_(), Y(E, {
                  key: 2,
                  modelValue: l.value[I.code],
                  "onUpdate:modelValue": (S) => l.value[I.code] = S,
                  clearable: "",
                  multiple: I.multiple || !1,
                  placeholder: I.desc,
                  style: { width: "400px" }
                }, {
                  default: g(() => [
                    (_(!0), V(ve, null, ye(I.dict, (S) => (_(), Y(N, {
                      key: S.value,
                      label: S.label,
                      value: S.value
                    }, null, 8, ["label", "value"]))), 128))
                  ]),
                  _: 2
                }, 1032, ["modelValue", "onUpdate:modelValue", "multiple", "placeholder"])) : I.type === 4 ? (_(), V("div", md, [
                  I.multiple ? (_(), Y(ce, {
                    key: 1,
                    modelValue: l.value[I.code],
                    "onUpdate:modelValue": (S) => l.value[I.code] = S,
                    placeholder: I.desc
                  }, {
                    default: g(() => [
                      h(z, { gutter: 20 }, {
                        default: g(() => [
                          (_(!0), V(ve, null, ye(I.dict, (S, W) => (_(), Y(K, {
                            span: I.dict.length < 3 ? null : 8,
                            key: W
                          }, {
                            default: g(() => [
                              h(ge, {
                                label: String(S.value)
                              }, {
                                default: g(() => [
                                  Se(A(S.label), 1)
                                ]),
                                _: 2
                              }, 1032, ["label"])
                            ]),
                            _: 2
                          }, 1032, ["span"]))), 128))
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    _: 2
                  }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])) : (_(), Y(oe, {
                    key: 0,
                    modelValue: l.value[I.code],
                    "onUpdate:modelValue": (S) => l.value[I.code] = S,
                    placeholder: c(r)("common.pleaseInput")
                  }, {
                    default: g(() => [
                      h(z, { gutter: 20 }, {
                        default: g(() => [
                          (_(!0), V(ve, null, ye(I.dict, (S, W) => (_(), Y(K, {
                            span: I.dict.length < 3 ? null : 8,
                            key: W
                          }, {
                            default: g(() => [
                              h(M, {
                                label: String(S.value)
                              }, {
                                default: g(() => [
                                  Se(A(S.label), 1)
                                ]),
                                _: 2
                              }, 1032, ["label"])
                            ]),
                            _: 2
                          }, 1032, ["span"]))), 128))
                        ]),
                        _: 2
                      }, 1024)
                    ]),
                    _: 2
                  }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"]))
                ])) : I.type === 5 ? (_(), V("div", vd, [
                  (_(!0), V(ve, null, ye(d.value[I.code], (S, W) => (_(), V("span", {
                    key: W,
                    class: "el-tag is-closable el-tag--light",
                    style: { "margin-right": "10px", "margin-bottom": "5px" }
                  }, [
                    v("span", gd, A(S.handlerName), 1),
                    v("i", {
                      class: "el-icon el-tag__close",
                      onClick: (Q) => p(I.code, S),
                      style: { cursor: "pointer" }
                    }, [
                      h(F, { "icon-class": "close" })
                    ], 8, wd)
                  ]))), 128)),
                  h(ue, {
                    type: "primary",
                    onClick: (S) => u(I.code)
                  }, {
                    default: g(() => [
                      Se(A(c(r)("between.selectHandler")), 1)
                    ]),
                    _: 2
                  }, 1032, ["onClick"])
                ])) : I.type === 6 ? (_(), Y(X, {
                  key: 5,
                  modelValue: l.value[I.code],
                  "onUpdate:modelValue": (S) => l.value[I.code] = S,
                  placeholder: I.desc,
                  precision: I.precision ? I.precision : 0,
                  step: I.step ? Number(I.step) : 1,
                  min: I.min ? Number(I.min) : 0,
                  style: { width: "400px", "margin-right": "10px", "margin-bottom": "5px" }
                }, null, 8, ["modelValue", "onUpdate:modelValue", "placeholder", "precision", "step", "min"])) : I.type === 7 ? (_(), V("div", yd, [
                  ["timepicker", "timepickerrange"].includes(I.dateType) ? (_(), Y(we, {
                    key: 0,
                    "is-range": I.dateType === "timepickerrange",
                    modelValue: l.value[I.code],
                    "onUpdate:modelValue": (S) => l.value[I.code] = S,
                    "value-format": I.dateFormat,
                    placeholder: I.desc
                  }, null, 8, ["is-range", "modelValue", "onUpdate:modelValue", "value-format", "placeholder"])) : (_(), Y(fe, {
                    key: 1,
                    clearable: "",
                    modelValue: l.value[I.code],
                    "onUpdate:modelValue": (S) => l.value[I.code] = S,
                    type: I.dateType ? I.dateType : "datetime",
                    "value-format": I.dateFormat,
                    placeholder: I.desc
                  }, null, 8, ["modelValue", "onUpdate:modelValue", "type", "value-format", "placeholder"]))
                ])) : j("", !0)
              ]),
              _: 2
            }, 1032, ["label", "prop", "rules"]))), 128))
          ]),
          _: 1
        }, 8, ["model", "disabled"]),
        s.value ? (_(), Y(se, {
          key: 0,
          title: c(r)("between.userSelectTitle"),
          modelValue: s.value,
          "onUpdate:modelValue": k[3] || (k[3] = (I) => s.value = I),
          width: "80%",
          "append-to-body": ""
        }, {
          default: g(() => [
            h(Kr, {
              selectUser: l.value[a.value],
              "onUpdate:selectUser": k[0] || (k[0] = (I) => l.value[a.value] = I),
              userVisible: s.value,
              "onUpdate:userVisible": k[1] || (k[1] = (I) => s.value = I),
              permissionRows: d.value[a.value],
              onHandleUserSelect: k[2] || (k[2] = (I) => f(I, a.value))
            }, null, 8, ["selectUser", "userVisible", "permissionRows"])
          ]),
          _: 1
        }, 8, ["title", "modelValue"])) : j("", !0)
      ], 64);
    };
  }
}), nr = /* @__PURE__ */ Ee(bd, [["__scopeId", "data-v-31c5baed"]]), Oo = { 0: "start", 1: "between", 2: "end", 3: "serial", 4: "parallel", 5: "inclusive" }, _d = (e) => {
  const t = {
    nodes: [],
    edges: []
  };
  if (t.flowCode = e.flowCode, t.flowName = e.flowName, t.modelValue = e.modelValue, t.category = e.category, t.version = e.version, t.formCustom = e.formCustom, t.formPath = e.formPath, t.listenerType = e.listenerType, t.listenerPath = e.listenerPath, !e.nodeList)
    return t;
  const o = e.nodeList.reduce((a, i) => (i.skipList && Array.isArray(i.skipList) && a.push(...i.skipList), a), []), r = e.nodeList;
  if (r.length)
    for (var n = 0, l = r.length; n < l; n++) {
      let a = r[n], i = {
        text: {},
        properties: {}
      };
      i.type = Oo[a.nodeType], i.id = a.nodeCode;
      let u = a.coordinate;
      if (u) {
        const f = u.split("|"), p = f[0].split(",");
        if (i.x = parseInt(p[0]), i.y = parseInt(p[1]), f.length === 2) {
          const b = f[1].split(",");
          i.text.x = parseInt(b[0]), i.text.y = parseInt(b[1]);
        }
      }
      // 坐标缺失或非法（AI 工具保存的定义不带 coordinate）时按序纵向排布兜底，
      // 否则 x/y 为 undefined 全部节点渲染在同一点、文字堆叠不可用
      isFinite(i.x) || (i.x = 200), isFinite(i.y) || (i.y = 80 + n * 120);
      if (i.text.value = a.nodeName, i.properties.nodeRatio = a.nodeRatio.toString(), i.properties.permissionFlag = a.permissionFlag, i.properties.anyNodeSkip = a.anyNodeSkip, i.properties.listenerType = a.listenerType, i.properties.listenerPath = a.listenerPath, i.properties.formCustom = a.formCustom, i.properties.formPath = a.formPath, i.properties.status = a.status, i.properties.chartStatusColor = e.chartStatusColor, i.properties.promptContent = a.promptContent, i.properties.ext = {}, a.ext && typeof a.ext == "string")
        try {
          a.ext = JSON.parse(a.ext), a.ext.forEach((f) => {
            i.properties.ext[f.code] = String(f.value).includes(",") ? f.value.split(",") : String(f.value);
          });
        } catch (f) {
          console.error("Error parsing JSON:", f);
        }
      t.nodes.push(i);
    }
  if (o.length) {
    let a = null, i = {};
    for (var s = 0, d = o.length; s < d; s++) {
      a = o[s], i = {
        text: {},
        properties: {}
      }, i.id = a.id, i.type = "skip", i.sourceNodeId = a.nowNodeCode, i.targetNodeId = a.nextNodeCode, i.text = { value: a.skipName }, i.properties.skipCondition = a.skipCondition, i.properties.skipName = a.skipName, i.properties.skipType = a.skipType, i.properties.status = a.status, i.properties.chartStatusColor = e.chartStatusColor, a.expr && (i.properties.expr = a.expr);
      const f = a.coordinate;
      if (f) {
        const p = f.split("|");
        if (i.pointsList = [], p[0].split(";").forEach((b) => {
          const y = b.split(",");
          i.pointsList.push({
            x: parseInt(y[0]),
            y: parseInt(y[1])
          });
        }), i.startPoint = i.pointsList[0], i.endPoint = i.pointsList[i.pointsList.length - 1], p.length > 1) {
          let b = p[1].split(",");
          i.text.x = parseInt(b[0]), i.text.y = parseInt(b[1]);
        }
      }
      t.edges.push(i);
    }
  }
  return t;
}, Xr = (e) => {
  const t = {
    nodeList: []
  }, o = (l) => {
    for (const s in Oo)
      if (Oo[s] === l)
        return s;
  }, r = (l) => {
    for (const s of t.nodeList)
      if (l === s.nodeCode)
        return s.nodeType;
  }, n = (l) => {
    let s = "";
    for (let d = 0; d < l.pointsList.length; d++)
      s = s + parseInt(l.pointsList[d].x) + "," + parseInt(l.pointsList[d].y), d !== l.pointsList.length - 1 && (s = s + ";");
    return l.text && (s = s + "|" + parseInt(l.text.x) + "," + parseInt(l.text.y)), s;
  };
  return t.id = e.id, t.flowCode = e.flowCode, t.flowName = e.flowName, t.modelValue = e.modelValue, t.category = e.category, t.version = e.version, t.formCustom = e.formCustom, t.formPath = e.formPath, t.listenerType = e.listenerType, t.listenerPath = e.listenerPath, e.nodes.forEach((l) => {
    let s = {};
    s.nodeType = o(l.type), s.nodeCode = l.id, l.text && (s.nodeName = l.text.value), s.permissionFlag = l.properties.permissionFlag, s.nodeRatio = l.properties.nodeRatio, s.anyNodeSkip = l.properties.anyNodeSkip, s.listenerType = l.properties.listenerType, s.listenerPath = l.properties.listenerPath, s.formCustom = l.properties.formCustom, l.properties.formPath && String(l.properties.formPath).trim() && (s.formPath = l.properties.formPath.trim()), s.ext = [];
    for (const d in l.properties.ext)
      if (Object.prototype.hasOwnProperty.call(l.properties.ext, d)) {
        let a = l.properties.ext[d];
        s.ext.push({ code: d, value: Array.isArray(a) ? a.join(",") : a });
      }
    s.ext = s.ext.filter((d) => {
      const a = d.value;
      return a != null && a !== "" && a !== "null" && a !== "undefined";
    }), s.ext = JSON.stringify(s.ext), s.coordinate = l.x + "," + l.y, l.text && l.text.x && l.text.y && (s.coordinate = s.coordinate + "|" + l.text.x + "," + l.text.y), s.handlerType = l.properties.handlerType, s.handlerPath = l.properties.handlerPath, s.version = t.version, s.skipList = [], e.edges.forEach((d) => {
      var a;
      if (d.sourceNodeId === l.id) {
        let i = {};
        i.skipType = d.properties.skipType, i.skipCondition = d.properties.skipCondition, i.skipName = ((a = d == null ? void 0 : d.text) == null ? void 0 : a.value) || d.properties.skipName, i.nowNodeCode = d.sourceNodeId, i.nowNodeType = r(i.nowNodeCode), i.nextNodeCode = d.targetNodeId, i.nextNodeType = r(i.nextNodeCode), i.coordinate = n(d), s.skipList.push(i);
      }
    }), t.nodeList.push(s);
  }), JSON.stringify(t);
}, ze = (e, t, o, r) => {
  const [n, l, s] = t.chartStatusColor && t.chartStatusColor.length === 3 ? t.chartStatusColor : ["56,161,105", "245,158,11", "107,114,128"];
  let d = s;
  const a = typeof document < "u" && document.documentElement.classList.contains("dark");
  return t.status === 2 ? (o === "node" && r !== "mimic" && (e.fill = `rgba(${n}, 0.08)`), e.stroke = `rgb(${n})`, d = n) : t.status === 1 ? (o === "node" && r !== "mimic" && (e.fill = `rgba(${l}, 0.08)`), e.stroke = `rgb(${l})`, e.strokeDasharray = "5 4", d = l) : (o === "node" && r !== "mimic" && (e.fill = a ? `rgba(${s}, 0.04)` : "rgba(255, 255, 255, 0.95)"), e.stroke = `rgb(${s})`, d = s), e.strokeWidth = 1.5, e.cursor = "pointer", e.strokeLinejoin = "round", e.strokeLinecap = "round", e.shadow = `drop-shadow(0 2px 8px rgba(${d}, 0.12)) drop-shadow(0 1px 3px rgba(0, 0, 0, 0.06))`, e._statusColorRGB = d, e._statusHex = `rgb(${d})`, e._statusRgba = (i) => `rgba(${d}, ${i})`, e;
}, We = (e, t, o) => (typeof window < "u" && window.__WF_FLOW_DESIGN_MODE__ && (e.stroke = `rgb(${o})`, e._statusColorRGB = o, e._statusHex = `rgb(${o})`, e._statusRgba = (n) => `rgba(${o}, ${n})`, e.shadow = `drop-shadow(0 2px 6px rgba(${o}, 0.14)) drop-shadow(0 1px 2px rgba(0, 0, 0, 0.04))`), e);
function Zr(e, t, o) {
  let r = Qr(t, o, /* @__PURE__ */ new Set());
  const n = [...new Set(r)];
  return e.filter((l) => n.includes(l.id)).reverse();
}
function Qr(e, t, o = /* @__PURE__ */ new Set()) {
  if (o.has(t))
    return [];
  o.add(t);
  let r = e.filter((l) => l.properties.skipType === "PASS");
  const n = [];
  for (const l of r)
    if (l.targetNodeId === t) {
      n.push(l.sourceNodeId);
      const s = Qr(r, l.sourceNodeId, o);
      n.push(...s);
    }
  return n;
}
function Te(e) {
  return e === "CLASSICS";
}
function Ue(e) {
  return ["serial", "parallel", "inclusive"].includes(e);
}
const yt = (e) => (ot("data-v-7ee5d3b7"), e = e(), nt(), e), kd = { class: "between" }, xd = { class: "modern-tabs-wrapper" }, Cd = { class: "modern-tabs" }, Sd = ["onClick"], Nd = {
  class: "tab-icon",
  viewBox: "0 0 24 24"
}, Id = ["d"], Ed = { class: "tab-label" }, Td = {
  key: 0,
  class: "tab-ext-tag"
}, Pd = { class: "tabPane" }, $d = { class: "base-settings-section" }, Ld = { class: "base-settings-content" }, Rd = { class: "radio-card-group" }, Dd = /* @__PURE__ */ yt(() => /* @__PURE__ */ v("span", { class: "radio-card-dot" }, null, -1)), Vd = { class: "radio-card-text" }, Md = /* @__PURE__ */ yt(() => /* @__PURE__ */ v("span", { class: "radio-card-dot" }, null, -1)), Od = { class: "radio-card-text" }, Fd = /* @__PURE__ */ yt(() => /* @__PURE__ */ v("span", { class: "radio-card-dot" }, null, -1)), Ad = { class: "radio-card-text" }, Bd = {
  key: 0,
  class: "mr5",
  style: { color: "red" }
}, Ud = { class: "placeholder mt5" }, zd = { class: "radio-card-group radio-card-sm" }, qd = /* @__PURE__ */ yt(() => /* @__PURE__ */ v("span", { class: "radio-card-dot" }, null, -1)), jd = { class: "radio-card-text" }, Hd = /* @__PURE__ */ yt(() => /* @__PURE__ */ v("span", { class: "radio-card-dot" }, null, -1)), Wd = { class: "radio-card-text" }, Gd = /* @__PURE__ */ yt(() => /* @__PURE__ */ v("span", { class: "ext-attributes-icon ext-icon-star" }, [
  /* @__PURE__ */ v("svg", {
    viewBox: "0 0 24 24",
    fill: "none",
    xmlns: "http://www.w3.org/2000/svg"
  }, [
    /* @__PURE__ */ v("path", {
      d: "M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z",
      fill: "currentColor"
    })
  ])
], -1)), Jd = { class: "ext-attributes-title" }, Yd = { class: "ext-attributes-badge" }, Kd = { class: "ext-collapse-arrow" }, Xd = {
  viewBox: "0 0 24 24",
  fill: "none",
  xmlns: "http://www.w3.org/2000/svg"
}, Zd = { class: "ext-attributes-content" }, Qd = { class: "tabPane tabPane-full" }, eu = { class: "section-card section-blue" }, tu = { class: "section-card-body" }, ou = { class: "action-buttons" }, nu = { class: "tabPane tabPane-full" }, ru = { class: "section-card section-purple" }, lu = { class: "section-card-body" }, su = { class: "action-buttons" }, au = { class: "tabPane tabPane-full" }, iu = {
  key: 0,
  class: "ext-tab-content"
}, du = /* @__PURE__ */ be({
  name: "Between",
  __name: "between",
  props: {
    modelValue: { default: () => ({}) },
    disabled: { type: Boolean, default: !1 },
    showWays: { type: Boolean, default: !0 },
    nodes: { default: () => [] },
    skips: { default: () => [] },
    formPathList: { default: () => [] }
  },
  emits: ["update:modelValue"],
  setup(e, { expose: t, emit: o }) {
    const { proxy: r } = tt(), { t: n } = xe(), l = e, s = D("1"), d = D(!0), a = {
      base: "M19.14 12.94c.04-.3.06-.61.06-.94 0-.32-.02-.64-.07-.94l2.03-1.58c.18-.14.23-.41.12-.61l-1.92-3.32c-.12-.22-.37-.29-.59-.22l-2.39.96c-.5-.38-1.03-.7-1.62-.94l-.36-2.54c-.04-.24-.24-.41-.48-.41h-3.84c-.24 0-.43.17-.47.41l-.36 2.54c-.59.24-1.13.57-1.62.94l-2.39-.96c-.22-.08-.47 0-.59.22L2.74 8.87c-.12.21-.08.47.12.61l2.03 1.58c-.05.3-.09.63-.09.94s.02.64.07.94l-2.03 1.58c-.18.14-.23.41-.12.61l1.92 3.32c.12.22.37.29.59.22l2.39-.96c.5.38 1.03.7 1.62.94l.36 2.54c.05.24.24.41.48.41h3.84c.24 0 .44-.17.47-.41l.36-2.54c.59-.24 1.13-.56 1.62-.94l2.39.96c.22.08.47 0 .59-.22l1.92-3.32c.12-.22.07-.47-.12-.61l-2.01-1.58zM12 15.6c-1.98 0-3.6-1.62-3.6-3.6s1.62-3.6 3.6-3.6 3.6 1.62 3.6 3.6-1.62 3.6-3.6 3.6z",
      handler: "M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5s-3 1.34-3 3 1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z",
      listener: "M12 22c1.1 0 2-.9 2-2h-4c0 1.1.89 2 2 2zm6-6v-5c0-3.07-1.64-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.63 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2z",
      ext: "M20.5 11H19V7c0-1.1-.9-2-2-2h-4V3.5C13 2.12 11.88 1 10.5 1S8 2.12 8 3.5V5H4c-1.1 0-1.99.9-1.99 2v3.8H3.5c1.49 0 2.7 1.21 2.7 2.7s-1.21 2.7-2.7 2.7H2V20c0 1.1.9 2 2 2h3.8v-1.5c0-1.49 1.21-2.7 2.7-2.7 1.49 0 2.7 1.21 2.7 2.7V22H17c1.1 0 2-.9 2-2v-4h1.5c1.38 0 2.5-1.12 2.5-2.5S21.88 11 20.5 11z"
    }, i = D([
      { label: n("start.tabBase"), name: "1", iconPath: a.base },
      { label: n("between.tabHandler"), name: "2", iconPath: a.handler },
      { label: n("start.tabListener"), name: "3", iconPath: a.listener }
    ]), u = D(l.modelValue), f = D(!1), p = qr(), b = D([]), y = D({});
    D([]), D();
    const w = D([]), k = D([]), F = o, m = zo({
      nodeRatio: le(() => {
        const $ = u.value.nodeRatioType;
        return $ ? $ === "passRatio" ? [
          { required: !0, message: n("common.pleaseInput"), trigger: "change" },
          { validator: T, trigger: ["change", "blur"] }
        ] : ["passCount", "rejectCount"].includes($) ? [
          { required: !0, message: n("common.pleaseInput"), trigger: "change" },
          { validator: O, trigger: ["change", "blur"] }
        ] : $ === "default" ? [
          { required: !0, message: n("common.pleaseInput"), trigger: "change" },
          { validator: N, trigger: ["change", "blur"] }
        ] : $ === "spel" ? [
          { required: !0, message: n("common.pleaseInput"), trigger: "change" },
          { validator: E, trigger: ["change", "blur"] }
        ] : $ === "snel" ? [
          { required: !0, message: n("common.pleaseInput"), trigger: "change" },
          { validator: M, trigger: ["change", "blur"] }
        ] : [] : [];
      }),
      listenerType: [{ required: !0, message: n("between.listenerTypeRequired"), trigger: "change" }],
      listenerPath: [{ required: !0, message: n("between.listenerPathRequired"), trigger: "blur" }]
    });
    de(() => u.value, ($) => {
      if ($ && F("update:modelValue", $), $.nodeRatioType) {
        let x = "";
        /^passCount|rejectCount/.test($.nodeRatioType) ? x = $.nodeRatioType + "=" : /^spel|default|snel/.test($.nodeRatioType) && (x = $.nodeRatioType + "@@"), $.nodeRatio = x + ($.nodeRatioValue ? $.nodeRatioValue : "");
      }
    }, { deep: !0 });
    function T($, x, q) {
      if (x === "" || x === void 0 || x === null)
        q(new Error(n("between.ratioPassRatioRequired")));
      else {
        const ne = Number(x);
        isNaN(ne) ? q(new Error(n("between.ratioInvalidNumber"))) : ne < 1e-3 || ne > 100 ? q(new Error(n("between.ratioRange"))) : /^\d+(\.\d{1,3})?$/.test(x) ? q() : q(new Error(n("between.ratioDecimal")));
      }
    }
    function O($, x, q) {
      x === "" || x === void 0 || x === null ? q(new Error(n("between.ratioCountRequired"))) : (x = x.replace("passCount", "").replace("rejectCount", "").replace("=", "").trim(), /^[1-9]\d*$/.test(x) ? q() : q(new Error(n("between.ratioPositiveInt"))));
    }
    function N($, x, q) {
      x = x.replace("default@@", "").replace("=", "").trim(), x === "" || x === void 0 || x === null ? q(new Error(n("skip.defaultRequired"))) : /^\$\{.*\}$/.test(x) ? q() : q(new Error(n("skip.defaultFormat")));
    }
    function E($, x, q) {
      x = x.replace("spel@@", "").replace("=", "").trim(), x === "" || x === void 0 || x === null ? q(new Error(n("skip.spelRequired"))) : /^\#\{.*\}$/.test(x) ? q() : q(new Error(n("skip.spelFormat")));
    }
    function M($, x, q) {
      x = x.replace("snel@@", "").replace("=", "").trim(), x === "" || x === void 0 || x === null ? q(new Error(n("skip.snelRequired"))) : /^\#\{.*\}$/.test(x) ? q() : q(new Error(n("skip.snelFormat")));
    }
    function K() {
      switch (u.value.nodeRatioType) {
        case "passRatio":
          return n("between.descPassRatio");
        case "passCount":
          return n("between.descPassCount");
        case "rejectCount":
          return n("between.descRejectCount");
        case "default":
          return n("between.descDefault");
        case "spel":
          return n("skip.descSpel");
        case "snel":
          return n("skip.descSnel");
        default:
          return n("common.pleaseInput");
      }
    }
    function z() {
      u.value.nodeRatioType = "", u.value.nodeRatioValue = "", u.value.nodeRatio = "";
    }
    function wfRatioUnit() {
      switch (u.value.nodeRatioType) {
        case "passRatio":
          return n("between.ratioValueUnitPassRatio");
        case "passCount":
          return n("between.ratioValueUnitPassCount");
        case "rejectCount":
          return n("between.ratioValueUnitRejectCount");
        default:
          return "";
      }
    }
    function oe($) {
      u.value.permissionFlag.splice($, 1), w.value.splice($, 1);
    }
    function ge() {
      u.value.permissionFlag.push(""), w.value.push({ storageId: "", handlerName: "" });
    }
    function ce($, x) {
      u.value.permissionFlag[x] = $.target.value;
    }
    function ue($) {
      switch ($) {
        case "1":
          break;
        case "2":
          we();
          break;
        case "3":
          fe();
          break;
      }
    }
    function X() {
      const $ = u.value.permissionFlag;
      if (u.value.permissionFlag = typeof $ == "string" && $ ? $.split("@@") : [""], u.value.listenerType && typeof u.value.listenerType == "string") {
        const x = u.value.listenerType.split(","), q = u.value.listenerPath, ne = typeof q == "string" && q ? q.split("@@") : [];
        u.value.listenerRows = x.map((G, ie) => ({
          listenerType: G,
          listenerPath: ne[ie]
        }));
      }
    }
    async function we() {
      if (u.value.permissionFlag) {
        let $ = u.value.permissionFlag;
        ln({ storageIds: $ }).then((x) => {
          x.code === 200 && x.data && (w.value = x.data);
        });
      }
    }
    async function fe() {
      Wr().then(($) => {
        $.code === 200 && $.data && (k.value = $.data);
      });
    }
    function P($, x) {
      if (!$) {
        x.listenerType = "";
        return;
      }
      const q = k.value.find((ne) => ne.path === $);
      q && q.type ? x.listenerType = q.type : x.listenerType = "";
    }
    function H() {
      fi().then(($) => {
        $.code === 200 && $.data && $.data.forEach((x) => {
          x.childs.forEach((q) => {
            var ne, G;
            if ([3, 4].includes(q.type) && q != null && q.dict) {
              if (((ne = u.value.ext) == null ? void 0 : ne[q.code]) === void 0)
                if (q.multiple)
                  u.value.ext = Object.assign({}, u.value.ext, { [q.code]: [] }), q.dict.forEach((ie) => {
                    ie.selected && u.value.ext[q.code].push(String(ie.value));
                  });
                else {
                  let ie = (G = q.dict.find((Ve) => Ve.selected)) == null ? void 0 : G.value;
                  u.value.ext = Object.assign({}, u.value.ext, { [q.code]: ie ? String(ie) : null });
                }
              else if (q.multiple) {
                let ie = u.value.ext[q.code];
                u.value.ext[q.code] = ie ? Array.isArray(ie) ? ie : ie.split(",") : [];
              }
            }
          }), x.type === 1 ? b.value.push(...x == null ? void 0 : x.childs) : x.type === 2 && (i.value.push({ label: x.name, name: x.code }), y.value[x.code] = x == null ? void 0 : x.childs);
        });
      });
    }
    function se() {
      f.value = !0;
    }
    function I($) {
      u.value.permissionFlag = $.map((x) => x.storageId).filter((x) => x), w.value = $;
    }
    function Z() {
      u.value.listenerRows.push({ listenerType: "", listenerPath: "" });
    }
    function S($) {
      u.value.listenerRows.splice($, 1);
    }
    const W = le(() => l.nodes.filter((x) => !["start", "serial", "parallel", "inclusive"].includes(x.type) && !(x.properties && x.properties.ext && x.properties.ext.nodeKind === "cc") && x.id !== u.value.nodeCode)), Q = le(() => typeof window > "u" ? !1 : window.innerWidth <= 768);
    X(), H();
    function ee() {
      return new Promise(async ($, x) => {
        s.value = "1", await r.$nextTick(), r.$refs.formRef.validate((q) => {
          q || x(!1);
        }), r.$refs.nodeBase && r.$refs.nodeBase.length > 0 ? await r.$refs.nodeBase[0].validate() ? B($) : x(!1) : B($);
      });
    }
    async function B($, x) {
      let q = i.value.slice(i.value.length);
      q.length === 0 && $(!0);
      for (const ne of q)
        if (s.value = ne.name, await r.$nextTick(), await r.$refs[`nodeExtList_${ne.name}`][0].validate())
          ne.name === q[q.length - 1].name && $(!0);
        else
          break;
    }
    return t({
      validate: ee
    }), ($, x) => {
      const q = L("wf-input"), ne = L("wf-form-item"), G = L("svg-icon"), ie = L("wf-icon"), Ve = L("wf-tooltip"), $e = L("wf-option"), Ke = L("wf-select"), _t = L("wf-tree-select"), qe = L("wf-table-column"), Xe = L("wf-button"), kt = L("wf-table"), xt = L("wf-form"), no = L("wf-dialog");
      return _(), V("div", kd, [
        h(xt, {
          ref: "formRef",
          class: "betweenForm",
          model: u.value,
          "label-width": "110px",
          rules: m,
          disabled: $.disabled
        }, {
          default: g(() => [
            v("div", xd, [
              v("div", Cd, [
                (_(!0), V(ve, null, ye(i.value, (J, he) => (_(), V("div", {
                  key: J.name,
                  class: _e(["modern-tab-item", { "is-active": s.value === J.name, "is-ext-tab": he >= 3 }]),
                  onClick: (hn) => {
                    s.value = J.name, ue(J.name);
                  }
                }, [
                  (_(), V("svg", Nd, [
                    v("path", {
                      d: J.iconPath || a.ext,
                      fill: "currentColor"
                    }, null, 8, Id)
                  ])),
                  v("span", Ed, A(J.label), 1),
                  he >= 3 ? (_(), V("span", Td, A(c(n)("between.extTag")), 1)) : j("", !0)
                ], 10, Sd))), 128))
              ])
            ]),
            ke(v("div", Pd, [
              v("div", $d, [
                v("div", Ld, [
                  h(ne, {
                    label: c(n)("node.codeLabel"),
                    prop: "nodeCode"
                  }, {
                    default: g(() => [
                      h(q, {
                        modelValue: u.value.nodeCode,
                        "onUpdate:modelValue": x[0] || (x[0] = (J) => u.value.nodeCode = J),
                        disabled: $.disabled
                      }, null, 8, ["modelValue", "disabled"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  h(ne, {
                    label: c(n)("node.nameLabel"),
                    prop: "nodeName"
                  }, {
                    default: g(() => [
                      h(q, {
                        modelValue: u.value.nodeName,
                        "onUpdate:modelValue": x[1] || (x[1] = (J) => u.value.nodeName = J),
                        type: "textarea",
                        disabled: $.disabled
                      }, null, 8, ["modelValue", "disabled"])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  h(ne, {
                    label: c(n)("between.formCustom"),
                    prop: "formCustom"
                  }, {
                    default: g(() => [
                      v("div", zd, [
                        v("label", {
                          class: _e(["radio-card-item", { "is-checked": u.value.formCustom === "N" }]),
                          onClick: x[8] || (x[8] = (J) => !$.disabled && (u.value.formCustom = "N"))
                        }, [
                          qd,
                          v("span", jd, A(c(n)("common.no")), 1),
                          h(Ve, {
                            effect: "dark",
                            placement: "top",
                            content: c(n)("between.formCustomNoTip")
                          }, {
                            default: g(() => [
                              h(ie, {
                                size: 13,
                                class: "radio-card-tip"
                              }, {
                                default: g(() => [
                                  h(G, { "icon-class": "ep:warning-filled" })
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["content"])
                        ], 2),
                        v("label", {
                          class: _e(["radio-card-item", { "is-checked": u.value.formCustom === "Y" }]),
                          onClick: x[9] || (x[9] = (J) => !$.disabled && (u.value.formCustom = "Y"))
                        }, [
                          Hd,
                          v("span", Wd, A(c(n)("common.yes")), 1),
                          h(Ve, {
                            effect: "dark",
                            placement: "top",
                            content: c(n)("between.formCustomYesTip")
                          }, {
                            default: g(() => [
                              h(ie, {
                                size: 13,
                                class: "radio-card-tip"
                              }, {
                                default: g(() => [
                                  h(G, { "icon-class": "ep:warning-filled" })
                                ]),
                                _: 1
                              })
                            ]),
                            _: 1
                          }, 8, ["content"])
                        ], 2)
                      ])
                    ]),
                    _: 1
                  }, 8, ["label"]),
                  u.value.formCustom === "N" ? (_(), Y(ne, {
                    key: 1,
                    label: c(n)("between.formPath"),
                    prop: "formPath"
                  }, {
                    default: g(() => [
                      h(q, {
                        modelValue: u.value.formPath,
                        "onUpdate:modelValue": x[10] || (x[10] = (J) => u.value.formPath = J)
                      }, null, 8, ["modelValue"])
                    ]),
                    _: 1
                  }, 8, ["label"])) : u.value.formCustom === "Y" ? (_(), Y(ne, {
                    key: 2,
                    label: c(n)("between.formKey"),
                    prop: "formPath"
                  }, {
                    default: g(() => [
                      h(_t, {
                        modelValue: u.value.formPath,
                        "onUpdate:modelValue": x[11] || (x[11] = (J) => u.value.formPath = J),
                        data: $.formPathList,
                        props: { value: "id", label: "name", children: "children" },
                        "value-key": "id",
                        placeholder: c(n)("baseInfo.categoryPlaceholder"),
                        "check-strictly": ""
                      }, null, 8, ["modelValue", "data", "placeholder"])
                    ]),
                    _: 1
                  }, 8, ["label"])) : j("", !0),
                  me($.$slots, "node-form-extra", {
                    form: u.value,
                    disabled: $.disabled,
                    nodes: W.value
                  }, void 0, !0)
                ])
              ]),
              b.value.length > 0 ? (_(), V("div", {
                key: 0,
                class: _e(["ext-attributes-section ext-primary", { "is-collapsed": d.value }])
              }, [
                v("div", {
                  class: "ext-attributes-header ext-header-clickable",
                  onClick: x[12] || (x[12] = (J) => d.value = !d.value)
                }, [
                  Gd,
                  v("span", Jd, A(c(n)("between.extAttributes")), 1),
                  v("span", Yd, A(c(n)("between.extCount", { n: b.value.length })), 1),
                  v("span", Kd, [
                    (_(), V("svg", Xd, [
                      v("path", {
                        d: "M7.41 8.59L12 13.17l4.59-4.58L18 10l-6 6-6-6 1.41-1.41z",
                        class: _e({ "arrow-rotated": !d.value }),
                        fill: "currentColor"
                      }, null, 2)
                    ]))
                  ])
                ]),
                h(ar, { name: "ext-collapse" }, {
                  default: g(() => [
                    ke(v("div", Zd, [
                      h(c(nr), {
                        ref: "nodeBase",
                        modelValue: u.value.ext,
                        "onUpdate:modelValue": x[13] || (x[13] = (J) => u.value.ext = J),
                        formList: b.value,
                        disabled: $.disabled
                      }, null, 8, ["modelValue", "formList", "disabled"])
                    ], 512), [
                      [Ne, !d.value]
                    ])
                  ]),
                  _: 1
                })
              ], 2)) : j("", !0)
            ], 512), [
              [Ne, s.value === "1"]
            ]),
            ke(v("div", Qd, [
              v("div", eu, [
                v("div", tu, [
                  h(kt, {
                    data: w.value,
                    style: { width: "100%" },
                    class: "inputGroup handler-table-mobile",
                    "table-layout": Q.value ? "fixed" : "auto"
                  }, {
                    default: g(() => [
                      h(qe, {
                        prop: "storageId",
                        label: c(n)("between.handlerStorageId"),
                        width: Q.value ? void 0 : 250
                      }, {
                        default: g((J) => [
                          h(ne, { prop: "storageId" }, {
                            default: g(() => [
                              h(q, {
                                modelValue: J.row.storageId,
                                "onUpdate:modelValue": (he) => J.row.storageId = he,
                                style: { width: "100%" },
                                onBlur: (he) => ce(he, J.$index)
                              }, null, 8, ["modelValue", "onUpdate:modelValue", "onBlur"])
                            ]),
                            _: 2
                          }, 1024)
                        ]),
                        _: 1
                      }, 8, ["label", "width"]),
                      h(qe, {
                        prop: "handlerName",
                        label: c(n)("between.handlerName")
                      }, null, 8, ["label"]),
                      $.disabled ? j("", !0) : (_(), Y(qe, {
                        key: 0,
                        label: c(n)("common.operation"),
                        width: Q.value ? void 0 : 65,
                        align: "center"
                      }, {
                        default: g((J) => [
                          $.disabled ? j("", !0) : (_(), Y(Xe, {
                            key: 0,
                            link: "",
                            size: "small",
                            type: "danger",
                            onClick: (he) => oe(J.$index)
                          }, {
                            default: g(() => [
                              h(G, { "icon-class": "ep:delete" })
                            ]),
                            _: 2
                          }, 1032, ["onClick"]))
                        ]),
                        _: 1
                      }, 8, ["label", "width"]))
                    ]),
                    _: 1
                  }, 8, ["data", "table-layout"]),
                  v("div", ou, [
                    $.disabled ? j("", !0) : (_(), Y(Xe, {
                      key: 0,
                      class: "add-row-btn",
                      onClick: ge
                    }, {
                      default: g(() => [
                        Se(A(c(n)("between.addRowHandler")), 1)
                      ]),
                      _: 1
                    })),
                    $.disabled ? j("", !0) : (_(), Y(Xe, {
                      key: 1,
                      class: "add-row-btn add-row-btn-secondary",
                      onClick: se
                    }, {
                      default: g(() => [
                        Se(A(c(n)("between.selectHandler")), 1)
                      ]),
                      _: 1
                    }))
                  ])
                ])
              ])
            ], 512), [
              [Ne, s.value === "2"]
            ]),
            ke(v("div", nu, [
              v("div", ru, [
                v("div", lu, [
                  h(kt, {
                    data: u.value.listenerRows,
                    style: { width: "100%" }
                  }, {
                    default: g(() => [
                      h(qe, {
                        prop: "listenerType",
                        label: c(n)("common.type"),
                        width: Q.value ? 60 : 160
                      }, {
                        default: g((J) => [
                          h(ne, {
                            prop: "listenerRows." + J.$index + ".listenerType",
                            rules: m.listenerType
                          }, {
                            default: g(() => [
                              h(Ke, {
                                modelValue: J.row.listenerType,
                                "onUpdate:modelValue": (he) => J.row.listenerType = he,
                                placeholder: c(n)("common.pleaseSelect")
                              }, {
                                default: g(() => [
                                  h($e, {
                                    label: c(n)("start.listenerStart"),
                                    value: "start"
                                  }, null, 8, ["label"]),
                                  h($e, {
                                    label: c(n)("start.listenerAssignment"),
                                    value: "assignment"
                                  }, null, 8, ["label"]),
                                  h($e, {
                                    label: c(n)("start.listenerFinish"),
                                    value: "finish"
                                  }, null, 8, ["label"]),
                                  h($e, {
                                    label: c(n)("start.listenerCreate"),
                                    value: "create"
                                  }, null, 8, ["label"])
                                ]),
                                _: 2
                              }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])
                            ]),
                            _: 2
                          }, 1032, ["prop", "rules"])
                        ]),
                        _: 1
                      }, 8, ["label", "width"]),
                      h(qe, {
                        prop: "listenerPath",
                        label: c(n)("baseInfo.listenerPathLabel")
                      }, {
                        default: g((J) => [
                          h(ne, {
                            prop: "listenerRows." + J.$index + ".listenerPath",
                            rules: m.listenerPath
                          }, {
                            default: g(() => [
                              h(Ke, {
                                modelValue: J.row.listenerPath,
                                "onUpdate:modelValue": (he) => J.row.listenerPath = he,
                                placeholder: c(n)("baseInfo.listenerPathPlaceholder"),
                                "allow-create": "",
                                filterable: "",
                                clearable: "",
                                style: { width: "100%" },
                                onChange: (he) => P(he, J.row)
                              }, {
                                default: g(() => [
                                  (_(!0), V(ve, null, ye(k.value, (he) => (_(), Y($e, {
                                    key: he.path,
                                    label: he.description,
                                    value: he.path
                                  }, null, 8, ["label", "value"]))), 128))
                                ]),
                                _: 2
                              }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder", "onChange"])
                            ]),
                            _: 2
                          }, 1032, ["prop", "rules"])
                        ]),
                        _: 1
                      }, 8, ["label"]),
                      $.disabled ? j("", !0) : (_(), Y(qe, {
                        key: 0,
                        label: c(n)("common.operation"),
                        width: "65",
                        align: "center"
                      }, {
                        default: g((J) => [
                          h(Xe, {
                            link: "",
                            size: "small",
                            type: "danger",
                            onClick: (he) => S(J.$index)
                          }, {
                            default: g(() => [
                              h(G, { "icon-class": "ep:delete" })
                            ]),
                            _: 2
                          }, 1032, ["onClick"])
                        ]),
                        _: 1
                      }, 8, ["label"]))
                    ]),
                    _: 1
                  }, 8, ["data"]),
                  v("div", su, [
                    $.disabled ? j("", !0) : (_(), Y(Xe, {
                      key: 0,
                      class: "add-row-btn",
                      onClick: Z
                    }, {
                      default: g(() => [
                        Se(A(c(n)("common.addRow")), 1)
                      ]),
                      _: 1
                    }))
                  ])
                ])
              ])
            ], 512), [
              [Ne, s.value === "3"]
            ]),
            ke(v("div", au, [
              y.value[s.value] && y.value[s.value].length > 0 ? (_(), V("div", iu, [
                h(c(nr), {
                  ref: `nodeExtList_${s.value}`,
                  modelValue: u.value.ext,
                  "onUpdate:modelValue": x[14] || (x[14] = (J) => u.value.ext = J),
                  formList: y.value[s.value],
                  disabled: $.disabled
                }, null, 8, ["modelValue", "formList", "disabled"])
              ])) : j("", !0)
            ], 512), [
              [Ne, s.value !== "1" && s.value !== "2" && s.value !== "3"]
            ])
          ]),
          _: 3
        }, 8, ["model", "rules", "disabled"]),
        f.value ? (_(), Y(no, {
          key: 0,
          title: c(n)("between.userSelectTitle"),
          modelValue: f.value,
          "onUpdate:modelValue": x[17] || (x[17] = (J) => f.value = J),
          width: Q.value ? "96%" : "80%",
          "append-to-body": "",
          class: _e(["person-select-dialog", { "mobile-user-dialog": Q.value }])
        }, {
          default: g(() => [
            h(c(Kr), {
              selectUser: u.value.permissionFlag,
              "onUpdate:selectUser": x[15] || (x[15] = (J) => u.value.permissionFlag = J),
              userVisible: f.value,
              "onUpdate:userVisible": x[16] || (x[16] = (J) => f.value = J),
              permissionRows: w.value,
              onHandleUserSelect: I
            }, null, 8, ["selectUser", "userVisible", "permissionRows"])
          ]),
          _: 1
        }, 8, ["title", "modelValue", "width", "class"])) : j("", !0)
      ]);
    };
  }
}), uu = /* @__PURE__ */ Ee(du, [["__scopeId", "data-v-7ee5d3b7"]]), cu = { class: "gateway-wrapper" }, fu = { class: "base-settings-section" }, pu = { class: "base-settings-content" }, hu = /* @__PURE__ */ be({
  name: "Gateway",
  __name: "gateway",
  props: {
    modelValue: { default: () => ({}) },
    disabled: { type: Boolean, default: !1 }
  },
  setup(e) {
    const { t } = xe(), r = D(e.modelValue);
    return (n, l) => {
      const s = L("wf-input"), d = L("wf-form-item"), a = L("wf-form");
      return _(), V("div", cu, [
        h(a, {
          ref: "formRef",
          class: "gatewayForm",
          model: r.value,
          "label-width": "110px",
          disabled: n.disabled
        }, {
          default: g(() => [
            v("div", fu, [
              v("div", pu, [
                h(d, {
                  label: c(t)("node.codeLabel"),
                  prop: "nodeCode"
                }, {
                  default: g(() => [
                    h(s, {
                      modelValue: r.value.nodeCode,
                      "onUpdate:modelValue": l[0] || (l[0] = (i) => r.value.nodeCode = i),
                      disabled: n.disabled
                    }, null, 8, ["modelValue", "disabled"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                me(n.$slots, "node-form-extra", {
                  form: r.value,
                  disabled: n.disabled
                }, void 0, !0)
              ])
            ])
          ]),
          _: 3
        }, 8, ["model", "disabled"])
      ]);
    };
  }
}), Co = /* @__PURE__ */ Ee(hu, [["__scopeId", "data-v-3310e089"]]), mu = { class: "end-wrapper" }, vu = { class: "base-settings-section" }, gu = { class: "base-settings-content" }, wu = /* @__PURE__ */ be({
  name: "End",
  __name: "end",
  props: {
    modelValue: { default: () => ({}) },
    disabled: { type: Boolean, default: !1 }
  },
  emits: ["change"],
  setup(e, { emit: t }) {
    const { t: o } = xe(), n = D(e.modelValue), l = t, { proxy: s } = tt();
    de(() => n, (a) => {
      a && l("change", a);
    }, { deep: !0 });
    function d() {
      s.$refs.nodeInput.focus();
    }
    return (a, i) => {
      const u = L("wf-input"), f = L("wf-form-item"), p = L("wf-form");
      return _(), V("div", mu, [
        h(p, {
          ref: "formRef",
          class: "endForm",
          model: n.value,
          "label-width": "110px",
          disabled: a.disabled
        }, {
          default: g(() => [
            v("div", vu, [
              v("div", gu, [
                h(f, {
                  label: c(o)("node.codeLabel"),
                  prop: "nodeCode"
                }, {
                  default: g(() => [
                    h(u, {
                      modelValue: n.value.nodeCode,
                      "onUpdate:modelValue": i[0] || (i[0] = (b) => n.value.nodeCode = b),
                      disabled: a.disabled
                    }, null, 8, ["modelValue", "disabled"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                h(f, {
                  label: c(o)("node.nameLabel"),
                  prop: "nodeName"
                }, {
                  default: g(() => [
                    h(u, {
                      modelValue: n.value.nodeName,
                      "onUpdate:modelValue": i[1] || (i[1] = (b) => n.value.nodeName = b),
                      ref: "nodeInput",
                      disabled: a.disabled,
                      onChange: d
                    }, null, 8, ["modelValue", "disabled"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                me(a.$slots, "node-form-extra", {
                  form: n.value,
                  disabled: a.disabled
                }, void 0, !0)
              ])
            ])
          ]),
          _: 3
        }, 8, ["model", "disabled"])
      ]);
    };
  }
}), yu = /* @__PURE__ */ Ee(wu, [["__scopeId", "data-v-48f37c3c"]]), bu = { class: "skip-wrapper" }, _u = { class: "base-settings-section" }, ku = { class: "base-settings-content" }, xu = /* @__PURE__ */ be({
  name: "Skip",
  __name: "skip",
  props: {
    modelValue: { default: () => ({}) },
    disabled: { type: Boolean, default: !1 },
    skipConditionShow: { type: Boolean, default: !0 }
  },
  setup(e) {
    var b;
    const { t } = xe(), o = e, r = D(!1), n = D(o.modelValue), l = qr(), s = zo({
      skipCondition: le(() => {
        const y = n.value.conditionType;
        return y ? y === "default" ? [
          { required: !0, message: t("common.pleaseInput"), trigger: "change" },
          { validator: i, trigger: ["change", "blur"] }
        ] : y === "spel" ? [
          { required: !0, message: t("common.pleaseInput"), trigger: "change" },
          { validator: u, trigger: ["change", "blur"] }
        ] : y === "snel" ? [
          { required: !0, message: t("common.pleaseInput"), trigger: "change" },
          { validator: f, trigger: ["change", "blur"] }
        ] : [{ required: !1, message: t("common.pleaseInput"), trigger: "change" }] : [];
      })
    });
    de(() => n, (y) => {
      if (y = y.value, y.conditionType) {
        let w;
        w = y.conditionType + "@@", !/^spel/.test(y.conditionType) && !/^default/.test(y.conditionType) && !/^snel/.test(y.conditionType) && !/^wfexpr/.test(y.conditionType) && (w = w + (y.condition ? y.condition : "") + "|"), y.skipCondition = w + (y.conditionValue ? y.conditionValue : "");
      }
    }, { deep: !0 });
    function d(y) {
      r.value = ["spel", "default", "snel"].includes(y);
    }
    function a() {
      n.value.conditionType = "", r.value = !1, n.value.condition = "", n.value.conditionValue = "", n.value.skipCondition = "";
    }
    ["spel", "default", "snel"].includes((b = o.modelValue) == null ? void 0 : b.conditionType) && (r.value = !0);
    function i(y, w, k) {
      w = w.replace("default@@", "").replace("=", "").trim(), w === "" || w === void 0 || w === null ? k(new Error(t("skip.defaultRequired"))) : /^\$\{.*\}$/.test(w) ? k() : k(new Error(t("skip.defaultFormat")));
    }
    function u(y, w, k) {
      w = w.replace("spel@@", "").replace("=", "").trim(), w === "" || w === void 0 || w === null ? k(new Error(t("skip.spelRequired"))) : /^\#\{.*\}$/.test(w) ? k() : k(new Error(t("skip.spelFormat")));
    }
    function f(y, w, k) {
      w = w.replace("snel@@", "").replace("=", "").trim(), w === "" || w === void 0 || w === null ? k(new Error(t("skip.snelRequired"))) : /^\#\{.*\}$/.test(w) ? k() : k(new Error(t("skip.snelFormat")));
    }
    function p() {
      switch (n.value.conditionType) {
        case "default":
          return t("skip.descDefault");
        case "spel":
          return t("skip.descSpel");
        case "snel":
          return t("skip.descSnel");
        default:
          return t("common.pleaseInput");
      }
    }
    return (y, w) => {
      const k = L("wf-input"), F = L("wf-form-item"), m = L("wf-option"), T = L("wf-select"), O = L("wf-form");
      return _(), V("div", bu, [
        h(O, {
          ref: "formRef",
          class: "skipForm",
          model: n.value,
          "label-width": "110px",
          rules: s,
          disabled: y.disabled
        }, {
          default: g(() => [
            v("div", _u, [
              v("div", ku, [
                y.skipConditionShow ? (_(), Y(F, {
                  key: 0,
                  label: c(t)("skip.nameLabel"),
                  prop: "skipName"
                }, {
                  default: g(() => [
                    h(k, {
                      modelValue: n.value.skipName,
                      "onUpdate:modelValue": w[0] || (w[0] = (N) => n.value.skipName = N),
                      placeholder: c(t)("skip.namePlaceholder")
                    }, null, 8, ["modelValue", "placeholder"])
                  ]),
                  _: 1
                }, 8, ["label"])) : j("", !0),
                h(F, {
                  label: c(t)("skip.typeLabel"),
                  prop: "skipType"
                }, {
                  default: g(() => [
                    h(T, {
                      modelValue: n.value.skipType,
                      "onUpdate:modelValue": w[1] || (w[1] = (N) => n.value.skipType = N)
                    }, {
                      default: g(() => [
                        h(m, {
                          label: c(t)("skip.typePass"),
                          value: "PASS"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.typeReject"),
                          value: "REJECT"
                        }, null, 8, ["label"])
                      ]),
                      _: 1
                    }, 8, ["modelValue"])
                  ]),
                  _: 1
                }, 8, ["label"]),
                y.skipConditionShow ? (y.$slots["skip-condition"] ? me(y.$slots, "skip-condition", { form: n.value, disabled: y.disabled }, void 0, !0) : (_(), Y(F, {
                  key: 1,
                  label: c(t)("skip.conditionLabel"),
                  prop: "skipCondition"
                }, {
                  default: g(() => [
                    r.value ? j("", !0) : (_(), Y(k, {
                      key: 0,
                      modelValue: n.value.condition,
                      "onUpdate:modelValue": w[2] || (w[2] = (N) => n.value.condition = N),
                      placeholder: c(t)("skip.conditionName"),
                      style: He({ width: r.value ? "0%" : "30%" })
                    }, null, 8, ["modelValue", "placeholder", "style"])),
                    h(T, {
                      modelValue: n.value.conditionType,
                      "onUpdate:modelValue": w[3] || (w[3] = (N) => n.value.conditionType = N),
                      placeholder: c(t)("skip.conditionTypePlaceholder"),
                      style: He({ width: r.value ? "18%" : "25%", "margin-left": "1%" }),
                      clearable: "",
                      onChange: d,
                      onClear: a
                    }, {
                      default: g(() => [
                        h(m, {
                          label: c(t)("skip.opGt"),
                          value: "gt"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.opGe"),
                          value: "ge"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.opEq"),
                          value: "eq"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.opNe"),
                          value: "ne"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.opLt"),
                          value: "lt"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.opLe"),
                          value: "le"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.opLike"),
                          value: "like"
                        }, null, 8, ["label"]),
                        h(m, {
                          label: c(t)("skip.opNotLike"),
                          value: "notLike"
                        }, null, 8, ["label"]),
                        c(l) === "SPRING_BOOT" ? (_(), Y(m, {
                          key: 0,
                          label: c(t)("skip.opDefault"),
                          value: "default"
                        }, null, 8, ["label"])) : j("", !0),
                        c(l) === "SPRING_BOOT" ? (_(), Y(m, {
                          key: 1,
                          label: "spel",
                          value: "spel"
                        })) : j("", !0),
                        c(l) === "SOLON" ? (_(), Y(m, {
                          key: 2,
                          label: "snel",
                          value: "snel"
                        })) : j("", !0)
                      ]),
                      _: 1
                    }, 8, ["modelValue", "placeholder", "style"]),
                    h(k, {
                      modelValue: n.value.conditionValue,
                      "onUpdate:modelValue": w[4] || (w[4] = (N) => n.value.conditionValue = N),
                      placeholder: p(),
                      style: He({ width: r.value ? "80%" : "43%", "margin-left": "1%" })
                    }, null, 8, ["modelValue", "placeholder", "style"])
                  ]),
                  _: 1
                }, 8, ["label"]))) : j("", !0),
                me(y.$slots, "node-form-extra", {
                  form: n.value,
                  disabled: y.disabled
                }, void 0, !0)
              ])
            ])
          ]),
          _: 3
        }, 8, ["model", "rules", "disabled"])
      ]);
    };
  }
}), Cu = /* @__PURE__ */ Ee(xu, [["__scopeId", "data-v-3ff37a3b"]]), wfCcNode = (e) => {
  try {
    let t = e && e.properties && e.properties.ext;
    if (!t)
      return !1;
    typeof t == "string" && (t = JSON.parse(t));
    const o = Array.isArray(t) ? Object.fromEntries(t.map((r) => [r.code, r.value])) : t;
    return o ? String(o.nodeKind) === "cc" : !1;
  } catch (r) {
    return !1;
  }
}, Su = /* @__PURE__ */ be({
  name: "PropertySetting",
  __name: "propertySetting",
  props: {
    value: { default: () => ({}) },
    node: { default: () => ({}) },
    lf: { default: null },
    disabled: { type: Boolean, default: !1 },
    skipConditionShow: { type: Boolean, default: !0 },
    nodes: { default: () => [] },
    skips: { default: () => [] },
    formPathList: { default: () => [] }
  },
  setup(e, { expose: t }) {
    const { proxy: o } = tt(), { t: r } = xe(), n = D(typeof window < "u" ? window.innerWidth : 1024);
    typeof window < "u" && window.addEventListener("resize", () => {
      n.value = window.innerWidth;
    });
    const l = le(() => n.value <= 768 ? "100%" : "37%");
    let s = 0;
    const d = {
      start: Hs,
      between: uu,
      serial: Co,
      parallel: Co,
      inclusive: Co,
      end: yu,
      skip: Cu
    }, a = e, i = D(!1), u = D({}), f = D(void 0), p = D(null);
    function wfLiveNodes() {
      try {
        const gd = a.lf && typeof a.lf.getGraphData === "function" ? a.lf.getGraphData() : null;
        if (gd && Array.isArray(gd.nodes) && gd.nodes.length)
          return gd.nodes;
      } catch {
      }
      return a.nodes;
    }
    const b = le(() => a.node && a.node.type === "skip" ? r("property.titleEdge") : a.node && a.node.type === "serial" ? r("property.titleSerial") : a.node && a.node.type === "parallel" ? r("property.titleParallel") : a.node && a.node.type === "inclusive" ? r("property.titleInclusive") : a.node && a.node.type === "start" ? r("property.titleStart") : a.node && a.node.type === "end" ? r("property.titleEnd") : a.node && a.node.type === "between" && wfCcNode(a.node) ? "抄送节点" : r("property.titleBetween")), y = le(() => {
      if (!(!a.node || !a.node.type)) {
        if (a.node.type === "between" && wfCcNode(a.node))
          return Hs;
        return d[a.node.type];
      }
    });
    de(() => a.node, (m) => {
      if (m)
        if (f.value = m.id, m.type === "skip") {
          let T = m.properties.skipCondition, O, N, E = "";
          if (T) {
            let M = T.split("@@");
            if (T && (/^spel/.test(T) || /^default/.test(T) || /^wfexpr/.test(T)) || /^snel/.test(T))
              N = M && M.length > 0 ? M[0] : "", E = M && M.length > 1 ? M[1] : "";
            else if (T) {
              N = M && M.length > 0 ? M[0] : "";
              let K = M[1].split("|");
              O = K && K.length > 0 ? K[0] : "", E = K && K.length > 1 ? K[1] : "";
            }
          }
          u.value = {
            nodeType: m.type,
            skipType: m.properties.skipType,
            skipName: m.text instanceof Object ? m.text.value : m.text,
            skipCondition: T,
            condition: O,
            conditionType: N,
            conditionValue: E
          };
        } else {
          let T = m.properties.nodeRatio || "0";
          const wfExt = m.properties.ext;
          if (m.type === "between" && !wfCcNode(m)) {
            m.properties.collaborativeWay || (m.properties.collaborativeWay = "2");
            if (m.properties.collaborativeWay === "2" && (!m.properties.nodeRatio || !(wfExt && wfExt.voteType === "count") && parseFloat(m.properties.nodeRatio) === 0)) {
              m.properties.nodeRatio = "50", T = "50";
            }
          }
          let O = "passRatio", N = "";
          if (/^passCount|rejectCount/.test(T)) {
            const [K, z] = T.split("=");
            O = K, N = z;
          } else if (/^spel|default|snel/.test(T)) {
            const [K, z] = T.split("@@");
            O = K, N = z;
          } else
            N = T;
          if (wfExt && wfExt.voteType === "count" && !/^(passCount|rejectCount)=/.test(T)) {
            m.properties.collaborativeWay = "2";
            wfExt.voteCount !== void 0 && wfExt.voteCount !== null && wfExt.voteCount !== "" ? (O = "passCount", N = String(wfExt.voteCount)) : wfExt.voteRejectCount !== void 0 && wfExt.voteRejectCount !== null && wfExt.voteRejectCount !== "" ? (O = "rejectCount", N = String(wfExt.voteRejectCount)) : (O = "passCount", N = "");
          }
          m.properties.formCustom = JSON.stringify(m.properties) === "{}" ? "N" : m.properties.formCustom ? m.properties.formCustom : a.formPathList && a.formPathList.length > 0 ? "Y" : "N";
          let E = m.properties.listenerType ? m.properties.listenerType.split(",") : [], M = m.properties.listenerPath ? m.properties.listenerPath.split("@@") : [];
          m.properties.listenerRows = E && E.length > 0 ? E.map((K, z) => ({
            listenerType: K,
            listenerPath: M[z]
          })) : [{}], u.value = {
            nodeType: m.type,
            nodeCode: m.id,
            ext: m.properties.ext ? m.properties.ext : {},
            ...m.properties,
            nodeName: m.text instanceof Object ? m.text.value : m.text,
            nodeRatioType: O,
            nodeRatioValue: N
          };
        }
    }), de(() => u.value.nodeCode, (m) => {
      p.value = m;
    }), de(() => u.value.skipType, (m) => {
      a.lf.setProperties(f.value, {
        skipType: m
      });
    }), de(() => u.value.nodeName, (m) => {
      a.lf.updateText(f.value, m), a.lf.setProperties(f.value, {
        nodeName: m
      });
    }), de(() => u.value.collaborativeWay, (m) => {
      a.lf.setProperties(f.value, {
        nodeRatio: m === "1" ? "0" : m === "3" ? "100" : "50"
      });
    }), de(() => u.value.nodeRatio, (m) => {
      a.lf.setProperties(f.value, {
        nodeRatio: m
      });
    }), de(() => u.value.permissionFlag, (m) => {
      a.lf.setProperties(f.value, {
        permissionFlag: Array.isArray(m) ? m.filter((T) => T).join("@@") : m
      });
    }, { deep: !0 }), de(() => u.value.anyNodeSkip, (m) => {
      a.lf.setProperties(f.value, {
        anyNodeSkip: m
      });
    }), de(() => {
      var m;
      return (m = u.value.listenerRows) == null ? void 0 : m.map((T) => T.listenerType);
    }, (m) => {
      a.lf.setProperties(f.value, {
        listenerType: Array.isArray(m) ? m.join(",") : m
      });
    }, { deep: !0 }), de(() => {
      var m;
      return (m = u.value.listenerRows) == null ? void 0 : m.map((T) => T.listenerPath);
    }, (m) => {
      a.lf.setProperties(f.value, {
        listenerPath: Array.isArray(m) ? m.join("@@") : m
      });
    }, { deep: !0 }), de(() => u.value.formCustom, (m) => {
      a.lf.setProperties(f.value, {
        formCustom: m || ""
      });
    }), de(() => u.value.formPath, (m) => {
      a.lf.setProperties(f.value, {
        formPath: m
      });
    }), de(() => u.value.skipName, (m) => {
      ["skip"].includes(a.node.type) && (a.lf.updateText(f.value, m), a.lf.setProperties(f.value, {
        skipName: m
      }));
    }), de(() => u.value.skipCondition, (m) => {
      a.lf.setProperties(f.value, {
        skipCondition: m
      });
    }), de(() => u.value.ext, (m) => {
      a.lf.setProperties(f.value, {
        ext: m
      });
    }, { deep: !0 });
    function w() {
      s = Date.now(), window._markDrawerOpen && window._markDrawerOpen(), i.value = !0;
    }
    async function k() {
      var m, T;
      Date.now() - s < 200 || i.value && (!a.disabled && typeof ((T = o.$refs[(m = y.value) == null ? void 0 : m.name]) == null ? void 0 : T.validate) == "function" ? await o.$refs[y.value.name].validate().then(() => {
        F();
      }).catch((O) => {
      }) : F());
    }
    function F() {
      var m;
      p.value && f.value && (["skip"].includes((m = a.node) == null ? void 0 : m.type) ? a.lf.getEdgeModelById(p.value) || a.lf.changeEdgeId(f.value, p.value) : a.lf.getNodeModelById(p.value) || a.lf.changeNodeId(f.value, p.value)), i.value = !1, window._markDrawerClosed && window._markDrawerClosed();
    }
    return t({
      show: w,
      handleClose: k
    }), (m, T) => {
      const O = L("wf-drawer");
      return _(), V("div", null, [
        h(O, {
          ref: "drawerRef",
          title: b.value,
          "destroy-on-close": "",
          modelValue: i.value,
          "onUpdate:modelValue": T[1] || (T[1] = (N) => i.value = N),
          direction: "rtl",
          size: l.value,
          "append-to-body": !0,
          "before-close": k,
          class: "property-drawer-modern"
        }, {
          default: g(() => [
            (_(), Y(ul(y.value), {
              ref: y.value.name,
              modelValue: u.value,
              "onUpdate:modelValue": T[0] || (T[0] = (N) => u.value = N),
              disabled: m.disabled,
              skipConditionShow: m.skipConditionShow,
              nodes: wfLiveNodes(),
              skips: m.skips,
              "form-path-list": m.formPathList
            }, Dt({ _: 2 }, [
              ye(m.$slots, (N, E) => ({
                name: E,
                fn: g((M) => [
                  me(m.$slots, E, ut(ct(M || {})), void 0, !0)
                ])
              }))
            ]), 1032, ["modelValue", "disabled", "skipConditionShow", "nodes", "skips", "form-path-list"]))
          ]),
          _: 3
        }, 8, ["title", "modelValue", "size"])
      ]);
    };
  }
}), Nu = /* @__PURE__ */ Ee(Su, [["__scopeId", "data-v-7041cd3e"]]), Iu = { class: "app-container" }, Eu = { class: "form-section" }, Tu = { class: "section-title" }, Pu = { class: "radio-card-content" }, $u = { class: "radio-card-icon" }, Lu = { class: "radio-card-info" }, Ru = { class: "radio-card-title" }, Du = { class: "radio-card-desc" }, Vu = { class: "radio-card-content" }, Mu = { class: "radio-card-icon" }, Ou = { class: "radio-card-info" }, Fu = { class: "radio-card-title" }, Au = { class: "radio-card-desc" }, Bu = { class: "radio-card-warning" }, Uu = {
  key: 0,
  class: "radio-card-warning radio-card-warning--mobile"
}, zu = { class: "form-tip" }, qu = { class: "form-section" }, ju = { class: "section-title" }, Hu = /* @__PURE__ */ be({
  name: "BaseInfo",
  __name: "baseInfo",
  props: {
    disabled: { type: Boolean, default: !1 },
    logicJson: { default: () => ({}) },
    categoryList: { default: () => [] },
    formPathList: { default: () => [] },
    definitionId: { default: null }
  },
  emits: ["update:flow-name", "update:model-value", "validate-error"],
  setup(e, { expose: t, emit: o }) {
    const { proxy: r } = tt(), { t: n } = xe(), l = o, s = D(!1);
    function d() {
      s.value = window.innerWidth <= 768;
    }
    Uo(() => {
      d(), window.addEventListener("resize", d), s.value && !a.definitionId && (i.value.modelValue = "MIMIC");
    }), Wt(() => {
      window.removeEventListener("resize", d);
    });
    const a = e, i = D({
      id: null,
      flowCode: "",
      flowName: "",
      modelValue: "",
      category: "",
      formCustom: "N",
      formPath: "",
      listenerType: "",
      listenerPath: "",
      listenerRows: []
    });
    de(() => a.logicJson, (E) => {
      E && Object.keys(E).length > 0 && (Object.assign(i.value, E), i.value.formCustom || (i.value.formCustom = "N"), b(), s.value && !a.definitionId && (i.value.modelValue = "MIMIC"));
    }), D([]);
    const u = D([]), f = le(() => ({
      modelValue: [
        { required: !0, message: n("baseInfo.ruleModelRequired"), trigger: "blur" }
      ],
      flowCode: [
        { required: !0, message: n("baseInfo.ruleFlowCodeRequired"), trigger: "blur" }
      ],
      flowName: [
        { required: !0, message: n("baseInfo.ruleFlowNameRequired"), trigger: "blur" }
      ],
      formCustom: [
        { required: !0, message: n("baseInfo.ruleFormCustomRequired"), trigger: "change" }
      ],
      listenerType: [
        { required: !0, message: n("baseInfo.ruleListenerRequired"), trigger: ["change", "blur"] }
      ],
      listenerPath: [
        { required: !0, message: n("baseInfo.ruleListenerRequired"), trigger: ["change", "blur"] }
      ]
    })), p = D();
    function b() {
      if (i.value.listenerType) {
        const E = i.value.listenerType.split(","), M = i.value.listenerPath.split("@@");
        i.value.listenerRows = E.map((K, z) => ({
          listenerType: K,
          listenerPath: M[z]
        }));
      } else
        i.value.listenerRows = [];
    }
    function y() {
      var E;
      i.value.listenerRows.push({ listenerType: "", listenerPath: "" }), (E = p.value) == null || E.clearValidate("listenerRows");
    }
    function w(E) {
      i.value.listenerRows.splice(E, 1);
    }
    function k() {
      return new Promise((E) => {
        r.$nextTick(() => {
          r.$refs.formRef.validate((M, K) => {
            M ? E(!0) : (l("validate-error", K), E(!1));
          });
        });
      });
    }
    function F(E) {
      l("update:flow-name", E);
    }
    function m() {
      l("update:model-value");
    }
    function T() {
      return i.value.listenerType = i.value.listenerRows.map((E) => E.listenerType).join(","), i.value.listenerPath = i.value.listenerRows.map((E) => E.listenerPath).join("@@"), i.value;
    }
    function O() {
      Wr().then((E) => {
        E.code === 200 && E.data && (u.value = E.data);
      });
    }
    function N(E, M) {
      if (!E) {
        M.listenerType = "";
        return;
      }
      const K = u.value.find((z) => z.path === E);
      K && K.type ? M.listenerType = K.type : M.listenerType = "";
    }
    return t({ getFormData: T, validate: k }), O(), (E, M) => {
      const K = L("wf-input"), z = L("wf-form-item"), oe = L("svg-icon"), ge = L("wf-radio"), ce = L("wf-radio-group"), ue = L("wf-tree-select"), X = L("wf-switch"), we = L("wf-option"), fe = L("wf-select"), P = L("wf-table-column"), H = L("wf-button"), se = L("wf-table"), I = L("wf-form");
      return _(), V("div", Iu, [
        h(I, {
          ref_key: "formRef",
          ref: p,
          model: i.value,
          class: "dialogForm",
          rules: f.value,
          "label-width": "150px",
          disabled: E.disabled
        }, {
          default: g(() => [
            v("div", Eu, [
              v("div", Tu, A(c(n)("baseInfo.sectionBasic")), 1),
              h(z, {
                label: c(n)("baseInfo.flowCode"),
                prop: "flowCode"
              }, {
                default: g(() => [
                  h(K, {
                    modelValue: i.value.flowCode,
                    "onUpdate:modelValue": M[0] || (M[0] = (Z) => i.value.flowCode = Z),
                    placeholder: c(n)("baseInfo.flowCodePlaceholder"),
                    maxlength: "40"
                  }, null, 8, ["modelValue", "placeholder"])
                ]),
                _: 1
              }, 8, ["label"]),
              h(z, {
                label: c(n)("baseInfo.flowName"),
                prop: "flowName"
              }, {
                default: g(() => [
                  h(K, {
                    modelValue: i.value.flowName,
                    "onUpdate:modelValue": M[1] || (M[1] = (Z) => i.value.flowName = Z),
                    placeholder: c(n)("baseInfo.flowNamePlaceholder"),
                    maxlength: "100",
                    onInput: F
                  }, null, 8, ["modelValue", "placeholder"])
                ]),
                _: 1
              }, 8, ["label"]),
              h(z, {
                label: c(n)("baseInfo.model"),
                prop: "modelValue"
              }, {
                default: g(() => [
                  h(ce, {
                    modelValue: i.value.modelValue,
                    "onUpdate:modelValue": M[2] || (M[2] = (Z) => i.value.modelValue = Z),
                    disabled: !!E.definitionId || s.value,
                    onChange: m,
                    class: "radio-card-group"
                  }, {
                    default: g(() => [
                      h(ge, {
                        label: "CLASSICS",
                        class: "radio-card"
                      }, {
                        default: g(() => [
                          v("div", Pu, [
                            v("div", $u, [
                              h(oe, {
                                "icon-class": "classic",
                                class: "model-icon"
                              })
                            ]),
                            v("div", Lu, [
                              v("div", Ru, A(c(n)("baseInfo.modelClassic")), 1),
                              v("div", Du, A(c(n)("baseInfo.modelClassicDesc")), 1)
                            ])
                          ])
                        ]),
                        _: 1
                      }),
                      h(ge, {
                        label: "MIMIC",
                        class: "radio-card"
                      }, {
                        default: g(() => [
                          v("div", Vu, [
                            v("div", Mu, [
                              h(oe, {
                                "icon-class": "mimic",
                                class: "model-icon"
                              })
                            ]),
                            v("div", Ou, [
                              v("div", Fu, A(c(n)("baseInfo.modelMimic")), 1),
                              v("div", Au, A(c(n)("baseInfo.modelMimicDesc")), 1)
                            ])
                          ])
                        ]),
                        _: 1
                      })
                    ]),
                    _: 1
                  }, 8, ["modelValue", "disabled"]),
                  v("div", Bu, A(c(n)("baseInfo.modelSwitchWarning")), 1),
                  s.value ? (_(), V("div", Uu, A(c(n)("baseInfo.modelMobileWarning")), 1)) : j("", !0)
                ]),
                _: 1
              }, 8, ["label"]),
              h(z, {
                label: c(n)("baseInfo.category"),
                prop: "category"
              }, {
                default: g(() => [
                  h(ue, {
                    modelValue: i.value.category,
                    "onUpdate:modelValue": M[3] || (M[3] = (Z) => i.value.category = Z),
                    data: E.categoryList,
                    props: { value: "id", label: "name", children: "children" },
                    "value-key": "id",
                    placeholder: c(n)("baseInfo.categoryPlaceholder"),
                    "check-strictly": ""
                  }, null, 8, ["modelValue", "data", "placeholder"])
                ]),
                _: 1
              }, 8, ["label"]),
              h(z, {
                label: c(n)("baseInfo.formCustom"),
                prop: "formCustom"
              }, {
                default: g(() => [
                  h(X, {
                    modelValue: i.value.formCustom,
                    "onUpdate:modelValue": M[4] || (M[4] = (Z) => i.value.formCustom = Z),
                    size: "large",
                    "active-value": "Y",
                    "inactive-value": "N",
                    "active-text": c(n)("common.yes"),
                    "inactive-text": c(n)("common.no")
                  }, null, 8, ["modelValue", "active-text", "inactive-text"]),
                  v("span", zu, A(i.value.formCustom === "Y" ? c(n)("baseInfo.formCustomTipY") : c(n)("baseInfo.formCustomTipN")), 1)
                ]),
                _: 1
              }, 8, ["label"]),
              i.value.formCustom === "N" ? (_(), Y(z, {
                key: 0,
                label: c(n)("baseInfo.formPath"),
                prop: "formPath"
              }, {
                default: g(() => [
                  h(K, {
                    modelValue: i.value.formPath,
                    "onUpdate:modelValue": M[5] || (M[5] = (Z) => i.value.formPath = Z),
                    placeholder: c(n)("baseInfo.formPathPlaceholder"),
                    maxlength: "100"
                  }, null, 8, ["modelValue", "placeholder"])
                ]),
                _: 1
              }, 8, ["label"])) : i.value.formCustom === "Y" ? (_(), Y(z, {
                key: 1,
                label: c(n)("baseInfo.formKey"),
                prop: "formPath"
              }, {
                default: g(() => [
                  h(ue, {
                    modelValue: i.value.formPath,
                    "onUpdate:modelValue": M[6] || (M[6] = (Z) => i.value.formPath = Z),
                    data: E.formPathList,
                    props: { value: "id", label: "name", children: "children" },
                    "value-key": "id",
                    placeholder: c(n)("baseInfo.categoryPlaceholder"),
                    "check-strictly": ""
                  }, null, 8, ["modelValue", "data", "placeholder"])
                ]),
                _: 1
              }, 8, ["label"])) : j("", !0)
            ]),
            v("div", qu, [
              v("div", ju, A(c(n)("baseInfo.sectionListener")), 1),
              h(z, {
                prop: "listenerRows",
                class: "listenerItem"
              }, {
                default: g(() => [
                  h(se, {
                    data: i.value.listenerRows,
                    style: { width: "100%" },
                    "empty-text": c(n)("baseInfo.listenerEmpty")
                  }, {
                    default: g(() => [
                      h(P, {
                        prop: "listenerType",
                        width: s.value ? 60 : 160,
                        label: c(n)("common.type")
                      }, {
                        default: g((Z) => [
                          h(z, {
                            prop: `listenerRows.${Z.$index}.listenerType`,
                            rules: f.value.listenerType
                          }, {
                            default: g(() => [
                              h(fe, {
                                modelValue: Z.row.listenerType,
                                "onUpdate:modelValue": (S) => Z.row.listenerType = S,
                                placeholder: c(n)("baseInfo.listenerTypePlaceholder")
                              }, {
                                default: g(() => [
                                  h(we, {
                                    label: c(n)("start.listenerStart"),
                                    value: "start"
                                  }, null, 8, ["label"]),
                                  h(we, {
                                    label: c(n)("start.listenerAssignment"),
                                    value: "assignment"
                                  }, null, 8, ["label"]),
                                  h(we, {
                                    label: c(n)("start.listenerFinish"),
                                    value: "finish"
                                  }, null, 8, ["label"]),
                                  h(we, {
                                    label: c(n)("start.listenerCreate"),
                                    value: "create"
                                  }, null, 8, ["label"])
                                ]),
                                _: 2
                              }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder"])
                            ]),
                            _: 2
                          }, 1032, ["prop", "rules"])
                        ]),
                        _: 1
                      }, 8, ["width", "label"]),
                      h(P, {
                        prop: "listenerPath",
                        label: c(n)("baseInfo.listenerPathLabel")
                      }, {
                        default: g((Z) => [
                          h(z, {
                            prop: `listenerRows.${Z.$index}.listenerPath`,
                            rules: f.value.listenerPath
                          }, {
                            default: g(() => [
                              h(fe, {
                                modelValue: Z.row.listenerPath,
                                "onUpdate:modelValue": (S) => Z.row.listenerPath = S,
                                placeholder: c(n)("baseInfo.listenerPathPlaceholder"),
                                "allow-create": "",
                                filterable: "",
                                clearable: "",
                                style: { width: "100%" },
                                onChange: (S) => N(S, Z.row)
                              }, {
                                default: g(() => [
                                  (_(!0), V(ve, null, ye(u.value, (S) => (_(), Y(we, {
                                    key: S.path,
                                    label: S.description,
                                    value: S.path
                                  }, null, 8, ["label", "value"]))), 128))
                                ]),
                                _: 2
                              }, 1032, ["modelValue", "onUpdate:modelValue", "placeholder", "onChange"])
                            ]),
                            _: 2
                          }, 1032, ["prop", "rules"])
                        ]),
                        _: 1
                      }, 8, ["label"]),
                      E.disabled ? j("", !0) : (_(), Y(P, {
                        key: 0,
                        label: c(n)("common.operation"),
                        width: "65",
                        align: "center"
                      }, {
                        default: g((Z) => [
                          h(H, {
                            link: "",
                            size: "small",
                            type: "danger",
                            onClick: (S) => w(Z.$index)
                          }, {
                            default: g(() => [
                              h(oe, { "icon-class": "ep:delete" })
                            ]),
                            _: 2
                          }, 1032, ["onClick"])
                        ]),
                        _: 1
                      }, 8, ["label"]))
                    ]),
                    _: 1
                  }, 8, ["data", "empty-text"]),
                  E.disabled ? j("", !0) : (_(), Y(H, {
                    key: 0,
                    class: "add-row-btn",
                    onClick: y
                  }, {
                    default: g(() => [
                      Se(A(c(n)("common.addRow")), 1)
                    ]),
                    _: 1
                  }))
                ]),
                _: 1
              })
            ])
          ]),
          _: 1
        }, 8, ["model", "rules", "disabled"])
      ]);
    };
  }
}), Wu = /* @__PURE__ */ Ee(Hu, [["__scopeId", "data-v-db09ca47"]]), Gu = [
  {
    id: "start",
    type: "start",
    x: 260,
    y: 200,
    properties: {
      nodeRatio: "0",
      permissionFlag: null,
      anyNodeSkip: null,
      listenerType: null,
      listenerPath: null,
      formCustom: null,
      formPath: null,
      status: null,
      chartStatusColor: null,
      promptContent: null,
      ext: {},
      width: 40,
      height: 40
    },
    text: {
      x: 260,
      y: 200,
      value: "开始"
    }
  },
  {
    id: "submit",
    type: "between",
    x: 420,
    y: 200,
    properties: {
      nodeRatio: "0",
      permissionFlag: null,
      anyNodeSkip: null,
      listenerType: null,
      listenerPath: null,
      formCustom: null,
      formPath: null,
      status: null,
      chartStatusColor: null,
      promptContent: null,
      ext: {},
      width: 100,
      height: 80
    },
    text: {
      x: 420,
      y: 200,
      value: "中间节点"
    }
  },
  {
    id: "end",
    type: "end",
    x: 597,
    y: 200,
    properties: {
      nodeRatio: "0",
      permissionFlag: null,
      anyNodeSkip: null,
      listenerType: null,
      listenerPath: null,
      formCustom: null,
      formPath: null,
      status: null,
      chartStatusColor: null,
      promptContent: null,
      ext: {},
      width: 40,
      height: 40
    },
    text: {
      x: 597,
      y: 200,
      value: "结束"
    }
  }
], Ju = [
  {
    id: "90fdf94f-a37f-4920-ac97-350a3dccff4d",
    type: "skip",
    properties: {
      skipCondition: null,
      skipName: null,
      skipType: "PASS",
      status: null,
      chartStatusColor: null
    },
    sourceNodeId: "start",
    targetNodeId: "submit",
    sourceAnchorId: "start_1",
    targetAnchorId: "submit_3",
    startPoint: {
      x: 280,
      y: 200
    },
    endPoint: {
      x: 370,
      y: 200
    },
    pointsList: [
      {
        x: 280,
        y: 200
      },
      {
        x: 370,
        y: 200
      }
    ]
  },
  {
    id: "dc40f6b7-6a81-4f15-8626-ceb54e50e13c",
    type: "skip",
    properties: {
      skipType: "PASS"
    },
    sourceNodeId: "submit",
    targetNodeId: "end",
    sourceAnchorId: "submit_1",
    targetAnchorId: "end_3",
    startPoint: {
      x: 470,
      y: 200
    },
    endPoint: {
      x: 577,
      y: 200
    },
    pointsList: [
      {
        x: 470,
        y: 200
      },
      {
        x: 577,
        y: 200
      }
    ]
  }
], rr = {
  nodes: Gu,
  edges: Ju
}, Yu = [
  {
    id: "startId",
    type: "start",
    x: 700,
    y: 100,
    properties: {
      width: 220,
      height: 80
    },
    text: {
      x: 700,
      y: 100,
      value: "开始"
    }
  },
  {
    id: "betweenId",
    type: "between",
    x: 700,
    y: 250,
    properties: {
      collaborativeWay: "2",
      width: 220,
      height: 80
    },
    text: {
      x: 700,
      y: 250,
      value: "中间节点"
    }
  },
  {
    id: "endId",
    type: "end",
    x: 700,
    y: 380,
    properties: {
      width: 40,
      height: 40
    },
    text: {
      x: 700,
      y: 380,
      value: "结束"
    }
  }
], Ku = [
  {
    id: "startToBetweenId",
    type: "skip",
    properties: {
      skipType: "PASS"
    },
    sourceNodeId: "startId",
    targetNodeId: "betweenId",
    sourceAnchorId: "startId_2",
    targetAnchorId: "betweenId_0",
    startPoint: {
      x: 700,
      y: 140
    },
    endPoint: {
      x: 700,
      y: 210
    },
    pointsList: [
      {
        x: 700,
        y: 140
      },
      {
        x: 700,
        y: 210
      }
    ]
  },
  {
    id: "betweenToEndId",
    type: "skip",
    properties: {
      skipType: "PASS"
    },
    sourceNodeId: "betweenId",
    targetNodeId: "endId",
    sourceAnchorId: "betweenId_2",
    targetAnchorId: "endId_0",
    startPoint: {
      x: 700,
      y: 290
    },
    endPoint: {
      x: 700,
      y: 360
    },
    pointsList: [
      {
        x: 700,
        y: 290
      },
      {
        x: 700,
        y: 360
      }
    ]
  }
], Fo = {
  nodes: Yu,
  edges: Ku
}, Pe = 150, it = 150;
function ft(e, t, o, r, n) {
  let l = null;
  return n && (l = {
    value: n,
    x: o,
    y: r
  }), e.addNode({
    type: t,
    x: o,
    y: r,
    text: l
  });
}
function Be(e, t, o, r, n) {
  return e.addEdge({
    type: t,
    sourceNodeId: o,
    targetNodeId: r,
    pointsList: n
  });
}
function Qe(e, t, o, r, n, l, s) {
  return e.addEdge({
    type: t,
    sourceNodeId: o,
    targetNodeId: r,
    properties: n,
    text: l,
    pointsList: s,
    startPoint: s ? s[0] : null,
    endPoint: s ? s[s.length - 1] : null
  });
}
function Ao(e, t, o, r, n = /* @__PURE__ */ new Map(), l = /* @__PURE__ */ new Set(), s = /* @__PURE__ */ new Map()) {
  if (s.size === 0 && t.forEach((a) => s.set(a.id, a)), l.has(e.id))
    return;
  l.add(e.id);
  const d = dn(e.id, o);
  if (!(!d || d.length === 0))
    if (d.length > 1)
      for (let a = 0; a < d.length; a++) {
        const i = d[a];
        r.deleteEdge(i.id);
        const u = s.get(i.targetNodeId);
        u && (Ue(e.type) && n.has(i.sourceNodeId + ":" + i.targetNodeId) || (u.x > e.x ? Qe(r, "skip", e.id, i.targetNodeId, i.properties, i.text, [
          { x: e.x + e.properties.width / 2, y: e.y },
          { x: u.x, y: e.y },
          { x: u.x, y: u.y - u.properties.height / 2 }
        ]) : u.x < e.x ? Qe(r, "skip", e.id, i.targetNodeId, i.properties, i.text, [
          { x: e.x - e.properties.width / 2, y: e.y },
          { x: u.x, y: e.y },
          { x: u.x, y: u.y - u.properties.height / 2 }
        ]) : Qe(r, "skip", e.id, i.targetNodeId, i.properties, i.text, [
          { x: e.x, y: e.y + e.properties.height / 2 },
          { x: u.x, y: u.y - u.properties.height / 2 }
        ]), n.set(i.sourceNodeId + ":" + i.targetNodeId, i), Ao(u, t, o, r, n, l, s)));
      }
    else {
      const a = d[0];
      r.deleteEdge(a.id);
      const i = s.get(a.targetNodeId);
      if (!i || Ue(e.type) && n.has(a.sourceNodeId + ":" + a.targetNodeId))
        return;
      i.x > e.x ? Qe(r, "skip", e.id, a.targetNodeId, a.properties, a.text, [
        { x: e.x, y: e.y + e.properties.height / 2 },
        { x: e.x, y: i.y },
        { x: i.x - i.properties.width / 2, y: i.y }
      ]) : i.x < e.x ? Qe(r, "skip", e.id, a.targetNodeId, a.properties, a.text, [
        { x: e.x, y: e.y + e.properties.height / 2 },
        { x: e.x, y: i.y },
        { x: i.x + i.properties.width / 2, y: i.y }
      ]) : (n.set(a.sourceNodeId + ":" + a.targetNodeId, a), Qe(r, "skip", e.id, a.targetNodeId, a.properties, a.text, [
        { x: e.x, y: e.y + e.properties.height / 2 },
        { x: i.x, y: i.y - i.properties.height / 2 }
      ])), Ao(i, t, o, r, n, l, s);
    }
}
function Pt(e, t, o, r, n, l = !0, s = /* @__PURE__ */ new Map()) {
  if (s.size === 0 && (s = new Map(t.map((a) => [a.id, a]))), e.length > 1)
    for (let a = 0; a < e.length; a++) {
      const i = e[a];
      d(i);
    }
  else {
    const a = e[0];
    d(a);
  }
  function d(a) {
    const i = l ? s.get(a.targetNodeId) : s.get(a.sourceNodeId);
    if (n.has(i.id))
      return;
    n.add(i.id);
    const u = l ? dn(i.id, o) : tc(i.id, o);
    !u || u.length === 0 || Pt(u, t, o, r, n, l, s);
  }
}
function to(e) {
  const t = e.getGraphData().nodes, o = t.find((n) => n.type === "start"), r = e.getGraphData().edges;
  Ao(o, t, r, e);
}
const Xu = (e, t) => {
  const o = e.getGraphData().nodes, r = o.find((s) => s.id === t.sourceNodeId), n = o.find((s) => s.id === t.targetNodeId), l = ft(e, "between", r.x, Je(r, "between"), "中间节点");
  Be(e, "skip", r.id, l.id), e.deleteEdge(t.id), Qe(e, "skip", l.id, n.id, t.properties), oo(e, l), to(e);
}, Zu = (e, t, o) => {
  const r = e.getGraphData().nodes, n = e.getGraphData().edges, l = r.find((p) => p.id === t.sourceNodeId), s = r.find((p) => p.id === t.targetNodeId), d = ft(e, o, l.x, Je(l, o), "加节点");
  Be(e, "skip", l.id, d.id);
  const a = ft(e, "between", l.x - Pe, Je(d, "between"), "中间节点"), i = ft(e, "between", l.x + Pe, Je(d, "between"), "中间节点");
  Be(e, "skip", d.id, a.id), Be(e, "skip", d.id, i.id);
  const u = ft(e, o, l.x, Je(a, o), "加节点");
  Be(e, "skip", a.id, u.id), Be(e, "skip", i.id, u.id), e.deleteEdge(t.id), Be(e, "skip", u.id, s.id), oo(e, u);
  const f = [n.find((p) => p.id === t.id)];
  an(r, n, f, e, a, i), to(e);
}, Qu = (e, t) => {
  if (e.getNodeIncomingEdge(t.id).length > 1)
    return;
  const r = e.getGraphData().nodes, n = e.getGraphData().edges, l = $t(t.id, r, n), s = sn(t, r, n, l), d = Ht(t.id, r, n, s);
  let a = /* @__PURE__ */ new Set();
  d.forEach((p) => {
    p.type === "between" && !a.has(p.x) && a.add(p.x);
  }), d.forEach((p) => {
    s.id !== p.id && (e.graphModel.moveNode(p.id, -Pe, 0, !0), p.x = p.x - Pe);
  });
  const i = Bo(d), u = ft(
    e,
    "between",
    i.x + Pe * 2,
    Je(t, "between"),
    "中间节点"
  );
  d.push(e.getDataById(u.id)), Be(e, "skip", t.id, u.id);
  const f = [n.find((p) => p.targetNodeId === t.id)];
  an(r, n, f, e, el(d), Bo(d)), Be(e, "skip", u.id, s.id), to(e);
};
function sn(e, t, o, r, n = 1) {
  if ((!r || r.length === 0) && (r = $t(e.id, t, o)), r && r.length > 0) {
    if (r[0].type === e.type) {
      if (n === 1 && r[0].x === e.x)
        return r[0];
      dn(r[0].id, o).length > 1 ? n++ : n--;
    }
    return e = { id: r[0].id, type: e.type, x: e.x }, r = $t(e.id, t, o), sn(e, t, o, r, n);
  }
}
const ec = (e, t) => {
  const o = e.getNodeIncomingNode(t.id), r = e.getNodeOutgoingNode(t.id), [n, l] = [o[0], r[0]];
  let s = n, d = l;
  const a = e.getNodeIncomingEdge(l.id);
  e.deleteNode(t.id);
  let i = e.getGraphData().nodes, u = e.getGraphData().edges;
  if (Ue(n.type) && Ue(l.type) && n.type === l.type && a.length > 1) {
    let f = e.getNodeIncomingEdge(n.id);
    if (e.getNodeOutgoingNode(n.id).length >= 2) {
      i = e.getGraphData().nodes, u = e.getGraphData().edges;
      const y = $t(n.id, i, u), w = sn(n, i, u, y), k = Ht(n.id, i, u, w);
      let F = /* @__PURE__ */ new Set();
      k.forEach((O) => {
        O.type === "between" && !F.has(O.x) && F.add(O.x);
      }), k.sort((O, N) => O.x - N.x);
      let m = n.x - (F.size - 1) * Pe, T;
      k.forEach((O) => {
        w.id !== O.id && (T ? T = T + Pe * 2 : T = m, e.graphModel.moveNode2Coordinate(O.id, T, O.y, !0));
      });
    }
    if (e.getNodeOutgoingNode(n.id).length === 1) {
      s = e.getNodeIncomingNode(n.id)[0], d = e.getNodeOutgoingNode(l.id)[0];
      const y = Ht(n.id, i, u, l);
      e.deleteNode(n.id), y.forEach((w) => {
        e.deleteNode(w.id);
      }), f = [Be(e, "skip", s.id, d.id)];
    }
    i = e.getGraphData().nodes, u = e.getGraphData().edges;
    let p = /* @__PURE__ */ new Set();
    Pt(f, i, u, e, p), Pt(f, i, u, e, p, !1);
    const b = i.filter((y) => p.has(y.id));
    an(
      i,
      u,
      f,
      e,
      t.x < n.x ? el(b) : null,
      t.x < n.x ? null : Bo(b),
      !1,
      p
    );
  } else
    Be(e, "skip", s.id, d.id);
  oo(e, s, !1), to(e);
};
function an(e, t, o, r, n, l, s = !0, d = /* @__PURE__ */ new Set()) {
  (!d || d.size === 0) && (Pt(o, e, t, r, d), Pt(o, e, t, r, d, !1));
  let a = [], i = [], u = !s, f = !s;
  e.forEach((b) => {
    d.has(b.id) || (n && b.x <= n.x ? (a.push(b), s && n.x - b.x <= Pe && (u = !0), !s && n.x - b.x <= Pe * 2 && (u = !1)) : l && b.x >= l.x && (i.push(b), s && b.x - l.x <= Pe && (f = !0), !s && b.x - l.x <= Pe * 2 && (f = !1)));
  });
  let p = n && l ? 1 : 2;
  u && a.forEach((b) => {
    r.graphModel.moveNode(b.id, s ? -Pe * p : Pe * p, 0, !0);
  }), f && i.forEach((b) => {
    r.graphModel.moveNode(b.id, s ? Pe * p : -Pe * p, 0, !0);
  });
}
function Je(e, t) {
  let o;
  return ["start", "between"].includes(e.type) && t === "between" ? o = e.y + it : ["start", "between"].includes(e.type) && t === "end" ? o = e.y + it - 20 : ["start", "between"].includes(e.type) && Ue(t) ? o = e.y + it - 25 : Ue(e.type) && Ue(t) ? o = e.y + it - 50 : Ue(e.type) && t === "between" ? o = e.y + it - 25 : Ue(e.type) && t === "end" && (o = e.y + it - 45), o;
}
function oo(e, t, o = !0) {
  const r = e.getGraphData().nodes, n = e.getGraphData().edges, l = $t(t.id, r, n);
  !l || l.length === 0 || l.forEach((s) => {
    let d = Je(t, s.type), a = !1;
    if (o && s.y < d)
      a = !0;
    else if (!o)
      if (Ue(s.type)) {
        const i = oc(s.id, r, n), u = i.reduce((f, p) => p.y > f.y ? p : f, i[0]);
        d = Je(u, s.type), s.y >= d && (a = !0);
      } else
        s.y >= d && (a = !0);
    if (a) {
      e.graphModel.moveNode2Coordinate(s.id, s.x, d, !0);
      const i = e.graphModel.getNodeModelById(s.id);
      oo(e, i, o);
    }
  });
}
function Ht(e, t, o, r, n = /* @__PURE__ */ new Set(), l = []) {
  if (n.has(e) || (n.add(e), !t.find((a) => a.id === e)))
    return l;
  const d = o.filter((a) => a.sourceNodeId === e).map((a) => t.find((i) => i.id === a.targetNodeId)).filter(Boolean);
  for (const a of d)
    l.some((i) => i.id === a.id) || l.push(a), r && r.id === a.id ? r = a : Ht(a.id, t, o, r, n, l);
  return l;
}
function dn(e, t) {
  return t.filter((o) => o.sourceNodeId === e);
}
function tc(e, t) {
  return t.filter((o) => o.targetNodeId === e);
}
function $t(e, t, o) {
  return o.filter((r) => r.sourceNodeId === e).map((r) => t.find((n) => n.id === r.targetNodeId)).filter(Boolean);
}
function oc(e, t, o) {
  return o.filter((r) => r.targetNodeId === e).map((r) => t.find((n) => n.id === r.sourceNodeId)).filter(Boolean);
}
function Bo(e) {
  return e.length === 0 ? null : e.reduce((t, o) => o.x > t.x ? o : t, e[0]);
}
function el(e) {
  return e.length === 0 ? null : e.reduce((t, o) => o.x < t.x ? o : t, e[0]);
}
function nc() {
  return Ye().config();
}
const rc = pl(
  "app",
  {
    state: () => ({
      appParams: null
    }),
    actions: {
      async fetchTokenName() {
        const e = new URLSearchParams(window.location.search), t = {};
        let o = [];
        await nc().then((r) => {
          r.code === 200 && r.data && (r.data.tokenNameList && r.data.tokenNameList.length > 0 && (o = r.data.tokenNameList, li(r.data.tokenNameList)), r.data.framework && si(r.data.framework));
        }).catch(() => {
        }), this.appParams = null;
        for (const [r, n] of e.entries())
          n && n !== "undefined" && (o && o.length > 0 && o.includes(r) && ri(r, n), t[r] = n);
        this.appParams = t;
      }
    }
  }
), tl = {
  // ---- 基础调色板 ----
  primary: "#409eff",
  primaryDark: "#2b7de9",
  primaryLight: "#ecf5ff",
  primaryLighter: "#f0f7ff",
  success: "#67c23a",
  warning: "#e6a23c",
  danger: "#f56c6c",
  // ---- 文字颜色 ----
  textPrimary: "#303133",
  textRegular: "#606266",
  textSecondary: "#909399",
  textPlaceholder: "#c0c4cc",
  // ---- 边框颜色 ----
  borderColor: "#dcdfe6",
  borderLight: "#e4e7ed",
  borderLighter: "#ebeef5",
  // ---- 背景颜色 ----
  bgColor: "#f5f7fa",
  bgWhite: "#ffffff",
  bgPage: "#ffffff",
  // 页面/画布背景
  bgContainer: "#f5f7fa",
  // 容器背景
  // ---- LogicFlow 专用 ----
  gridColor: "#ccc",
  nodeTextColor: "#303133",
  nodeTextFill: "#303133",
  edgeTextBg: "#fff",
  snaplineStroke: "#1E90FF",
  // ---- 特殊组件 ----
  tooltipBg: "#fff",
  tooltipBorder: "#ccc",
  tooltipShadow: "0 2px 8px rgba(0, 0, 0, 0.15)",
  tooltipColor: "#333",
  // ---- 下载快照 ----
  snapshotBg: "#f5f5f5",
  // ---- 侧边栏 ----
  sidebarBg: "rgba(255, 255, 255, 0.95)",
  sidebarIconBg: "#f8fafc",
  // ---- 步骤标签 ----
  stepTabColor: "#64748b",
  stepTabActiveBgStart: "#3b82f6",
  stepTabActiveBgEnd: "#2563eb",
  // ---- 保存按钮 ----
  saveBtnBgStart: "#10b981",
  saveBtnBgEnd: "#059669",
  saveBtnShadow: "rgba(16, 185, 129, 0.3)",
  // ---- 流程名称 ----
  flowNameColor: "#1e293b",
  // ---- 工具栏分隔线 ----
  toolbarBorder: "#e2e8f0",
  // ---- 滚动条 ----
  scrollbarThumb: "#c0c4cc",
  scrollbarThumbHover: "#909399",
  // ---- Drawer ----
  drawerDisabledBg: "#f5f7fa"
}, ol = {
  // ---- 基础调色板 ----
  primary: "#409eff",
  // 主题色（按钮/链接/高亮）
  primaryDark: "#2b7de9",
  // 主题色深色态（hover/active）
  primaryLight: "#1a3a5c",
  // 主题色浅色背景（选中态/标签）
  primaryLighter: "#1a2e4a",
  // 主题色更浅背景（表头/次要区域）
  success: "#67c23a",
  // 成功状态绿
  warning: "#f56c6c",
  // 警告/提示（暗黑下偏红，增强警示感）
  danger: "#f56c6c",
  // 危险/错误红
  // ---- 文字颜色 ----
  textPrimary: "#e0e0e0",
  // 主文字（标题/正文）
  textRegular: "#b0b0b0",
  // 常规文字（说明/描述）
  textSecondary: "#888888",
  // 次要文字（辅助信息/占位符）
  textPlaceholder: "#5a5a5a",
  // 输入框 placeholder 灰
  // ---- 边框颜色 ----
  borderColor: "#333333",
  // 主边框（输入框/面板边框）
  borderLight: "#404040",
  // 浅边框（分割线/次要边框）
  borderLighter: "#4a4a4a",
  // 更浅边框（卡片内部分隔）
  // ---- 背景颜色 ----
  bgColor: "#141414",
  // 全局底色（body/页面主背景）
  bgWhite: "#1f1f1f",
  // 白色替代（卡片/弹窗/悬浮层背景，比底色略亮以区分层次）
  bgPage: "#141414",
  // 页面/画布背景（LogicFlow 画布底色）
  bgContainer: "#141414",
  // 容器背景（侧栏/面板容器）
  // ---- LogicFlow 专用 ----
  gridColor: "#404040",
  // 画布网格线颜色
  nodeTextColor: "#e0e0e0",
  // 节点内文字颜色
  nodeTextFill: "#e0e0e0",
  // 节点文字填充色（SVG text fill）
  edgeTextBg: "#141414",
  // 连线文字背景（避免遮挡线段）
  snaplineStroke: "#1E90FF",
  // 对齐辅助线颜色（拖拽对齐时显示）
  // ---- 特殊组件（Tooltip / Popover） ----
  tooltipBg: "#1f1f1f",
  // 弹出层背景
  tooltipBorder: "#333333",
  // 弹出层边框
  tooltipShadow: "0 2px 12px rgba(0, 0, 0, 0.4)",
  // 弹出层阴影（暗黑加深）
  tooltipColor: "#e0e0e0",
  // 弹出层文字颜色
  // ---- 下载快照 ----
  snapshotBg: "#141414",
  // 导出快照图片的背景色
  // ---- 侧边栏 ----
  sidebarBg: "#141414",
  // 左侧属性栏背景（半透明毛玻璃效果）
  sidebarIconBg: "#141414",
  // 侧边栏图标按钮背景
  // ---- 步骤标签（流程设计步骤条） ----
  stepTabColor: "#b0b0b0",
  // 未激活步骤文字颜色
  stepTabActiveBgStart: "#3b82f6",
  // 当前步骤渐变起始色
  stepTabActiveBgEnd: "#2563eb",
  // 当前步骤渐变结束色
  // ---- 保存按钮（暗黑降低饱和度） ----
  saveBtnBgStart: "#0d9488",
  // 保存按钮渐变起始色（青绿色）
  saveBtnBgEnd: "#0f766e",
  // 保存按钮渐变结束色
  saveBtnShadow: "rgba(13, 148, 136, 0.25)",
  // 保存按钮阴影
  // ---- 流程名称 ----
  flowNameColor: "#e0e0e0",
  // 流程名称标题文字颜色
  // ---- 工具栏分隔线 ----
  toolbarBorder: "#333333",
  // 顶部工具栏底部边框
  // ---- 滚动条 ----
  scrollbarThumb: "#4a4a4a",
  // 滚动块颜色
  scrollbarThumbHover: "#606060",
  // 滚动块 hover 颜色
  // ---- Drawer 抽屉 ----
  drawerDisabledBg: "#2a2d35"
  // 抽屉禁用态背景色（已发布不可编辑时）
}, lc = [
  "bgColor",
  "bgWhite",
  "bgPage",
  "bgContainer",
  "edgeTextBg",
  "snapshotBg",
  "sidebarBg",
  "sidebarIconBg"
];
function lr(e) {
  if (!e || typeof e != "string")
    return {};
  const t = {};
  for (const o of lc)
    t[o] = e;
  return t;
}
let gt = {};
function Bt(e, t = !1) {
  const o = e === "dark" ? { ...ol } : { ...tl };
  return t || e !== "dark" || !gt ? o : { ...o, ...gt };
}
function So(e) {
  e != null && e.dark && (gt = { ...gt, ...e.dark });
}
function sc() {
  gt = {};
}
function ac() {
  return gt;
}
const ic = {
  primary: "--wf-primary",
  primaryDark: "--wf-primary-dark",
  primaryLight: "--wf-primary-light",
  primaryLighter: "--wf-primary-lighter",
  success: "--wf-success",
  warning: "--wf-warning",
  danger: "--wf-danger",
  textPrimary: "--wf-text-primary",
  textRegular: "--wf-text-regular",
  textSecondary: "--wf-text-secondary",
  textPlaceholder: "--wf-text-placeholder",
  borderColor: "--wf-border-color",
  borderLight: "--wf-border-light",
  borderLighter: "--wf-border-lighter",
  bgColor: "--wf-bg-color",
  bgWhite: "--wf-bg-white",
  bgPage: "--wf-bg-page",
  bgContainer: "--wf-bg-container",
  gridColor: "--wf-grid-color",
  nodeTextColor: "--wf-node-text-color",
  nodeTextFill: "--wf-node-text-fill",
  edgeTextBg: "--wf-edge-text-bg",
  snaplineStroke: "--wf-snapline-stroke",
  tooltipBg: "--wf-tooltip-bg",
  tooltipBorder: "--wf-tooltip-border",
  tooltipShadow: "--wf-tooltip-shadow",
  tooltipColor: "--wf-tooltip-color",
  snapshotBg: "--wf-snapshot-bg",
  sidebarBg: "--wf-sidebar-bg",
  sidebarIconBg: "--wf-sidebar-icon-bg",
  stepTabColor: "--wf-step-tab-color",
  stepTabActiveBgStart: "--wf-step-tab-active-bg-start",
  stepTabActiveBgEnd: "--wf-step-tab-active-bg-end",
  saveBtnBgStart: "--wf-save-btn-bg-start",
  saveBtnBgEnd: "--wf-save-btn-bg-end",
  saveBtnShadow: "--wf-save-btn-shadow",
  flowNameColor: "--wf-flow-name-color",
  toolbarBorder: "--wf-toolbar-border",
  scrollbarThumb: "--wf-scrollbar-thumb",
  scrollbarThumbHover: "--wf-scrollbar-thumb-hover",
  drawerDisabledBg: "--wf-disabled-bg"
};
function Nt(e, t) {
  const o = document.documentElement, r = Bt(e);
  for (const [n, l] of Object.entries(ic))
    r[n] !== void 0 && o.style.setProperty(l, r[n]);
}
const dt = D(!1);
function nl() {
  const e = le(() => rc().appParams), t = le(
    () => Bt(dt.value ? "dark" : "light")
  ), o = ol, r = tl;
  function n() {
    const f = e.value, p = f == null ? void 0 : f.theme, b = p === "theme-dark", y = b ? "dark" : "light";
    b ? (dt.value = !0, document.documentElement.classList.add("dark")) : p === "theme-light" && (dt.value = !1, document.documentElement.classList.remove("dark")), l(f, y), Nt(y);
  }
  function l(f, p) {
    const b = f == null ? void 0 : f.darkColors;
    if (!(!b || p !== "dark") && typeof b == "string" && /^[0-9a-fA-F]{3,8}$/.test(b)) {
      const y = "#" + b;
      So({ dark: lr(y) }), Nt(p);
    }
  }
  function s(f) {
    const { data: p } = f;
    switch (p.type) {
      case "theme-dark":
        dt.value = !0, document.documentElement.classList.add("dark"), d(p, "dark"), Nt("dark");
        return;
      case "theme-light":
        dt.value = !1, document.documentElement.classList.remove("dark"), d(p, "light"), Nt("light");
        return;
    }
  }
  function d(f, p) {
    const b = f.darkColors;
    if (!(!b || p !== "dark") && typeof b == "string" && /^[0-9a-fA-F]{3,8}$/.test(b)) {
      const y = "#" + b;
      So({ dark: lr(y) }), Nt(p);
    }
  }
  function a(f, p) {
    if (!f)
      return;
    const b = Bt(p ? "dark" : "light");
    f.graphModel.background = {
      background: b.bgPage
    }, f.graphModel.grid && (f.graphModel.grid.config = {
      ...f.graphModel.grid.config,
      color: b.gridColor
    }), f.setTheme({
      snapline: {
        stroke: b.snaplineStroke,
        strokeWidth: 2
      },
      nodeText: {
        color: b.nodeTextColor,
        fill: b.nodeTextFill,
        fontSize: 13,
        fontWeight: 500
      },
      edgeText: {
        fontSize: 13,
        strokeWidth: 1,
        background: {
          fill: b.edgeTextBg
        }
      }
    });
  }
  function i() {
    window.addEventListener("message", s), window.parent !== window && window.parent.postMessage({ method: "getTheme" }, "*");
  }
  function u() {
    window.removeEventListener("message", s);
  }
  return {
    isDark: dt,
    themeColors: t,
    // 响应式：当前模式的完整颜色对象（含用户覆盖）
    dark: o,
    // 常量：默认暗黑配色
    light: r,
    // 常量：默认亮色配色
    initFromUrl: n,
    applyDarkTheme: a,
    setupMessageListener: i,
    cleanupMessageListener: u,
    // 外部 API：传入自定义颜色
    setCustomThemeColors: So,
    resetThemeColors: sc,
    getUserOverride: ac,
    getThemeColors: Bt
  };
}
const dc = { class: "tooltip-container" }, uc = ["onClick"], cc = /* @__PURE__ */ be({
  name: "EdgeTooltip",
  __name: "EdgeTooltip",
  props: {
    position: { default: () => ({ x: 0, y: 0 }) },
    tooltipEdge: { default: () => ({}) }
  },
  emits: ["option-click", "close-tooltip"],
  setup(e, { emit: t }) {
    const { isDark: o, themeColors: r } = nl(), { t: n } = xe(), l = e, s = [
      { icon: "between", label: n("edgeTooltip.approval") },
      { icon: "serial", label: n("sidebar.serial") },
      { icon: "parallel", label: n("sidebar.parallel") },
      { icon: "inclusive", label: n("sidebar.inclusive") }
    ], d = t, a = le(() => ({
      top: `${l.position.y}px`,
      left: `${l.position.x + 20}px`,
      position: "absolute",
      pointerEvents: "auto",
      backgroundColor: r.value.tooltipBg,
      border: `1px solid ${r.value.tooltipBorder}`,
      borderRadius: "12px",
      boxShadow: r.value.tooltipShadow,
      padding: "6px",
      fontSize: "13px",
      zIndex: 1e3,
      color: r.value.tooltipColor,
      display: "flex",
      width: "max-content"
    }));
    function i() {
      window.isTooltipHovered = !0;
    }
    function u() {
      window.isTooltipHovered = !1, d("close-tooltip");
    }
    const f = (p) => {
      p.tooltipEdge = l.tooltipEdge, d("option-click", p);
    };
    return (p, b) => {
      const y = L("svg-icon");
      return _(), V("div", {
        style: He(a.value),
        onMouseenter: i,
        onMouseleave: u
      }, [
        v("div", dc, [
          (_(), V(ve, null, ye(s, (w, k) => v("div", {
            key: k,
            onClick: (F) => f(w),
            class: "tooltip-item"
          }, [
            h(y, {
              "icon-class": w.icon,
              class: "tooltip-icon"
            }, null, 8, ["icon-class"]),
            v("span", null, A(w.label), 1)
          ], 8, uc)), 64))
        ])
      ], 36);
    };
  }
}), fc = /* @__PURE__ */ Ee(cc, [["__scopeId", "data-v-12f95daf"]]), ae = {
  start: "103,194,58",
  // 绿：起点
  between: "64,158,255",
  // 蓝：审批
  end: "245,108,108",
  // 红：终止
  serial: "245,158,11",
  // 橙：互斥
  parallel: "19,194,194",
  // 青：并行
  inclusive: "146,84,222"
  // 紫：包含
}, pe = (e) => `rgb(${e})`, Lt = (e, t) => `rgba(${e},${t})`, bt = "var(--wf-icon-bg, #ffffff)", pc = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="si-core" cx="35%" cy="35%" r="65%">
      <stop offset="0%" stop-color="${pe(ae.start)}"/>
      <stop offset="70%" stop-color="${Lt(ae.start, 0.4)}"/>
    </radialGradient>
  </defs>
  <circle cx="50" cy="50" r="42" fill="${bt}" stroke="${pe(ae.start)}" stroke-width="2.5"/>
  <circle cx="50" cy="50" r="30" fill="url(#si-core)"/>
</svg>`, hc = `
<svg viewBox="0 0 100 80" xmlns="http://www.w3.org/2000/svg">
  <rect x="5" y="5" width="90" height="70" rx="8" fill="${bt}" stroke="${pe(ae.between)}" stroke-width="1.5"/>
  <!-- 左上角审批小图标（放大，偏右下） -->
  <rect x="12" y="10" width="32" height="26" rx="5" ry="5" fill="${Lt(ae.between, 0.08)}" stroke="${pe(ae.between)}" stroke-width="1.2"/>
  <circle cx="28" cy="23" r="5.5" fill="${Lt(ae.between, 0.15)}" stroke="${pe(ae.between)}" stroke-width="1"/>
  <path d="M24 23l4 4l6-6" fill="none" stroke="${pe(ae.between)}" stroke-width="1.5" stroke-linecap="square" stroke-linejoin="miter"/>
</svg>`, mc = `
<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <circle cx="50" cy="50" r="42" fill="${bt}" stroke="${pe(ae.end)}" stroke-width="3.5"/>
  <circle cx="50" cy="50" r="30" fill="none" stroke="${Lt(ae.end, 0.25)}" stroke-width="1"/>
</svg>`, un = '<rect x="8" y="8" width="34" height="34" rx="5" transform="rotate(45 25 25)"', vc = `
<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  ${un} fill="${bt}" stroke="${pe(ae.serial)}" stroke-width="2"/>
  <!-- X 图标（直线，无圆角端点） -->
  <path d="M17 17 L33 33 M33 17 L17 33" fill="none" stroke="${pe(ae.serial)}" stroke-width="2.5" stroke-linecap="square" stroke-linejoin="miter"/>
  <!-- 四端装饰圆点 -->
  <circle cx="14.5" cy="14.5" r="1.3" fill="${pe(ae.serial)}"/>
  <circle cx="34.5" cy="14.5" r="1.3" fill="${pe(ae.serial)}"/>
  <circle cx="34.5" cy="34.5" r="1.3" fill="${pe(ae.serial)}"/>
  <circle cx="14.5" cy="34.5" r="1.3" fill="${pe(ae.serial)}"/>
</svg>`, gc = `
<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  ${un} fill="${bt}" stroke="${pe(ae.parallel)}" stroke-width="2"/>
  <!-- 十字图标（直线） -->
  <path d="M15 25 L35 25" fill="none" stroke="${pe(ae.parallel)}" stroke-width="3" stroke-linecap="square"/>
  <path d="M25 15 L25 35" fill="none" stroke="${pe(ae.parallel)}" stroke-width="3" stroke-linecap="square"/>
  <!-- 四端装饰圆点 -->
  <circle cx="25" cy="12" r="1.5" fill="${pe(ae.parallel)}"/>
  <circle cx="38" cy="25" r="1.5" fill="${pe(ae.parallel)}"/>
  <circle cx="25" cy="38" r="1.5" fill="${pe(ae.parallel)}"/>
  <circle cx="12" cy="25" r="1.5" fill="${pe(ae.parallel)}"/>
</svg>`, wc = `
<svg viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
  ${un} fill="${bt}" stroke="${pe(ae.inclusive)}" stroke-width="2"/>
  <!-- 同心双圆 -->
  <circle cx="25" cy="25" r="11" fill="none" stroke="${pe(ae.inclusive)}" stroke-width="2"/>
  <circle cx="25" cy="25" r="5.5" fill="${Lt(ae.inclusive, 0.15)}" stroke="${pe(ae.inclusive)}" stroke-width="1.5"/>
  <!-- 中心点缀 -->
  <circle cx="25" cy="25" r="1.8" fill="${pe(ae.inclusive)}"/>
</svg>`, yc = { class: "diagram-sidebar" }, bc = { class: "sidebar-header" }, _c = { class: "sidebar-title" }, kc = { class: "sidebar-content" }, xc = { class: "node-group" }, Cc = ["onMousedown"], Sc = ["innerHTML"], Nc = { class: "item-label" }, Ic = {
  key: 0,
  class: "sidebar-divider"
}, Ec = {
  key: 1,
  class: "group-header"
}, Tc = { class: "group-title" }, Pc = {
  key: 2,
  class: "node-group"
}, $c = ["onMousedown"], Lc = ["innerHTML"], Rc = { class: "item-label" }, Dc = /* @__PURE__ */ be({
  name: "DiagramSidebar",
  __name: "DiagramSidebar",
  props: {
    flowNodes: {},
    gatewayNodes: {}
  },
  emits: ["dragInNode"],
  setup(e, { emit: t }) {
    const { t: o } = xe(), r = t, n = e, l = le(() => [
      { type: "start", text: o("sidebar.start"), label: o("sidebar.start"), icon: pc },
      { type: "between", text: o("sidebar.between"), label: o("sidebar.between"), icon: hc, properties: { collaborativeWay: "2" } },
      { type: "end", text: o("sidebar.end"), label: o("sidebar.end"), icon: mc }
    ]), s = le(() => [
      { type: "serial", text: "", label: o("sidebar.serial"), icon: vc, properties: {} },
      { type: "parallel", text: "", label: o("sidebar.parallel"), icon: gc, properties: {} },
      { type: "inclusive", text: "", label: o("sidebar.inclusive"), icon: wc, properties: {} }
    ]), d = le(() => n.flowNodes ?? l.value), a = le(() => n.gatewayNodes ?? s.value);
    function i(u) {
      r("dragInNode", u.type, u.properties || {}, u.text || {});
    }
    return (u, f) => (_(), V("div", yc, [
      v("div", bc, [
        v("span", _c, A(c(o)("sidebar.baseNodes")), 1)
      ]),
      v("div", kc, [
        v("div", xc, [
          (_(!0), V(ve, null, ye(d.value, (p) => (_(), V("div", {
            key: p.type + "-" + p.label,
            class: _e(["sidebar-item", [`item-${p.type}`]]),
            onMousedown: (b) => i(p)
          }, [
            p.icon ? (_(), V("div", {
              key: 0,
              class: "item-icon-wrap",
              innerHTML: p.icon
            }, null, 8, Sc)) : j("", !0),
            v("span", Nc, A(p.label), 1)
          ], 42, Cc))), 128))
        ]),
        a.value.length ? (_(), V("div", Ic)) : j("", !0),
        a.value.length ? (_(), V("div", Ec, [
          v("span", Tc, A(c(o)("sidebar.gatewayNodes")), 1)
        ])) : j("", !0),
        a.value.length ? (_(), V("div", Pc, [
          (_(!0), V(ve, null, ye(a.value, (p) => (_(), V("div", {
            key: p.type,
            class: _e(["sidebar-item", [`item-${p.type}`]]),
            onMousedown: (b) => i(p)
          }, [
            p.icon ? (_(), V("div", {
              key: 0,
              class: "item-icon-wrap",
              innerHTML: p.icon
            }, null, 8, Lc)) : j("", !0),
            v("span", Rc, A(p.label), 1)
          ], 42, $c))), 128))
        ])) : j("", !0)
      ])
    ]));
  }
}), Vc = /* @__PURE__ */ Ee(Dc, [["__scopeId", "data-v-988a6efd"]]), Mc = { class: "design-header" }, Oc = { class: "header-left" }, Fc = { class: "flow-name-wrapper" }, Ac = { class: "flow-name" }, Bc = { class: "header-center" }, Uc = { class: "steps-tabs" }, zc = ["onClick"], qc = { class: "tab-text" }, jc = { class: "header-right" }, Hc = /* @__PURE__ */ be({
  name: "FlowDesignerHeader",
  __name: "FlowDesignerHeader",
  props: {
    flowName: {},
    activeStep: {},
    steps: {},
    disabled: { type: Boolean }
  },
  emits: ["step-click", "save"],
  setup(e, { emit: t }) {
    const o = t, { t: r } = xe(), n = (s) => o("step-click", s), l = () => o("save");
    return (s, d) => {
      const a = L("svg-icon"), i = L("wf-tooltip"), u = L("wf-button");
      return _(), V("div", Mc, [
        v("div", Oc, [
          me(s.$slots, "header-left", { flowName: s.flowName }, () => [
            v("div", Fc, [
              h(i, {
                content: s.flowName,
                placement: "bottom",
                "show-after": 500
              }, {
                default: g(() => [
                  v("div", Ac, [
                    h(a, {
                      "icon-class": "flowName",
                      style: { "margin-right": "5px" }
                    }),
                    Se(" " + A(s.flowName || c(r)("flowDesigner.untitled")), 1)
                  ])
                ]),
                _: 1
              }, 8, ["content"])
            ])
          ])
        ]),
        v("div", Bc, [
          me(s.$slots, "header-center", {
            activeStep: s.activeStep,
            steps: s.steps,
            goToStep: n
          }, () => [
            v("div", Uc, [
              (_(!0), V(ve, null, ye(s.steps, (f, p) => (_(), V("div", {
                key: p,
                class: _e(["step-tab", { active: s.activeStep === p }]),
                onClick: (b) => n(p)
              }, [
                h(a, {
                  "icon-class": f.icon,
                  class: "tab-icon"
                }, null, 8, ["icon-class"]),
                v("span", qc, A(f.title), 1)
              ], 10, zc))), 128))
            ])
          ])
        ]),
        v("div", jc, [
          me(s.$slots, "header-actions", {
            save: l,
            disabled: s.disabled
          }, () => [
            s.disabled ? j("", !0) : (_(), Y(u, {
              key: 0,
              class: "save-btn",
              size: "default",
              onClick: l
            }, {
              default: g(() => [
                h(a, {
                  "icon-class": "save",
                  class: "save-icon"
                }),
                v("span", null, A(c(r)("common.save")), 1)
              ]),
              _: 1
            }))
          ])
        ])
      ]);
    };
  }
}), Wc = {
  class: "design-toolbar",
  style: { padding: "5px 0", "text-align": "right" }
}, Gc = { key: 0 }, Jc = { class: "toolbar-group" }, Yc = { class: "toolbar-group" }, Kc = { class: "toolbar-group" }, Xc = {
  key: 0,
  class: "toolbar-group"
}, Zc = /* @__PURE__ */ be({
  name: "FlowDesignerToolbar",
  __name: "FlowDesignerToolbar",
  props: {
    activeStep: {},
    onlyDesignShow: { type: Boolean },
    disabled: { type: Boolean },
    lf: {}
  },
  emits: ["zoom-out", "fit-view", "zoom-in", "undo", "redo", "clear", "download-image", "download-json", "save"],
  setup(e, { emit: t }) {
    const o = t, { t: r } = xe();
    return (n, l) => {
      const s = L("svg-icon"), d = L("wf-button"), a = L("wf-tooltip");
      return _(), V("div", Wc, [
        n.activeStep === 1 ? (_(), V("div", Gc, [
          v("span", Jc, [
            h(a, {
              content: c(r)("flowDesigner.zoomOut"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[0] || (l[0] = (i) => o("zoom-out"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:zoom-out" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"]),
            h(a, {
              content: c(r)("flowDesigner.fitView"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[1] || (l[1] = (i) => o("fit-view"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:rank" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"]),
            h(a, {
              content: c(r)("flowDesigner.zoomIn"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[2] || (l[2] = (i) => o("zoom-in"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:zoom-in" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"])
          ]),
          v("span", Yc, [
            h(a, {
              content: c(r)("flowDesigner.undo"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[3] || (l[3] = (i) => o("undo"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:d-arrow-left" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"]),
            h(a, {
              content: c(r)("flowDesigner.redo"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[4] || (l[4] = (i) => o("redo"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:d-arrow-right" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"]),
            h(a, {
              content: c(r)("flowDesigner.clear"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[5] || (l[5] = (i) => o("clear"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:delete" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"])
          ]),
          v("span", Kc, [
            h(a, {
              content: c(r)("flowDesigner.downloadImage"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[6] || (l[6] = (i) => o("download-image"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:picture" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"]),
            h(a, {
              content: c(r)("flowDesigner.downloadJson"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  onClick: l[7] || (l[7] = (i) => o("download-json"))
                }, {
                  default: g(() => [
                    h(s, { "icon-class": "ep:download" })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"])
          ]),
          n.onlyDesignShow && !n.disabled ? (_(), V("span", Xc, [
            h(a, {
              content: c(r)("common.save"),
              placement: "bottom"
            }, {
              default: g(() => [
                h(d, {
                  size: "small",
                  class: "toolbar-save-btn",
                  onClick: l[8] || (l[8] = (i) => o("save"))
                }, {
                  default: g(() => [
                    h(s, {
                      "icon-class": "save",
                      style: { width: "14px", height: "14px" }
                    })
                  ]),
                  _: 1
                })
              ]),
              _: 1
            }, 8, ["content"])
          ])) : j("", !0),
          me(n.$slots, "toolbar-extra", {
            lf: n.lf,
            disabled: n.disabled
          })
        ])) : j("", !0)
      ]);
    };
  }
});
let Qc = class extends jo {
  initNodeData(t) {
    super.initNodeData(t), this.r = 25;
  }
  getNodeStyle() {
    const t = ze(super.getNodeStyle(), this.properties, "node");
    return We(t, this.properties, "103,194,58");
  }
}, ef = class extends qo {
  getShape() {
    const { model: t } = this.props, { x: o, y: r, r: n } = t, s = t.getNodeStyle()._statusColorRGB || "166,178,189", d = typeof document < "u" && document.documentElement.classList.contains("dark");
    return C("g", {}, [
      // 定义渐变和滤镜
      C("defs", {}, [
        // 外环渐变描边
        C("linearGradient", { id: `start-grad-${t.id}`, x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, [
          C("stop", { offset: "0%", stopColor: `rgb(${s})` }),
          C("stop", { offset: "100%", stopColor: `rgba(${s}, 0.5)` })
        ]),
        // 内核径向渐变（实心圆点）
        C("radialGradient", { id: `start-core-${t.id}`, cx: "35%", cy: "35%", r: "65%" }, [
          C("stop", { offset: "0%", stopColor: `rgba(${s}, 0.9)` }),
          C("stop", { offset: "70%", stopColor: `rgba(${s}, 0.4)` }),
          C("stop", { offset: "100%", stopColor: `rgba(${s}, 0.15)` })
        ]),
        // 主外环背景填充（暗黑模式适配）
        C("radialGradient", { id: `start-bg-${t.id}`, cx: "50%", cy: "50%", r: "55%" }, [
          C("stop", { offset: "0%", stopColor: d ? "#252830" : "#ffffff" }),
          C("stop", { offset: "100%", stopColor: d ? "#181a20" : "#f0f2f5" })
        ]),
        // 外发光滤镜（柔和、不抢眼）
        C("filter", { id: `start-glow-${t.id}`, x: "-50%", y: "-50%", width: "200%", height: "200%" }, [
          C("feGaussianBlur", { stdDeviation: "2", result: "blur" }),
          C("feFlood", { floodColor: `rgb(${s})`, floodOpacity: 0.14, result: "color" }),
          C("feComposite", { in: "color", in2: "blur", operator: "in" })
        ])
      ]),
      // 外层发光效果（半透明大圆，柔和不抢眼）
      C("circle", {
        cx: o,
        cy: r,
        r: n + 5,
        fill: `rgba(${s}, ${d ? 0.07 : 0.035})`
      }),
      // 主外环（渐变描边 + 暗黑适配背景）
      C("circle", {
        cx: o,
        cy: r,
        r: n,
        fill: `url(#start-bg-${t.id})`,
        stroke: `url(#start-grad-${t.id})`,
        strokeWidth: 2.5,
        filter: `url(#start-glow-${t.id})`,
        style: { cursor: "pointer" }
      }),
      // 内核实心渐变圆点（放大）
      C("circle", {
        cx: o,
        cy: r,
        r: n * 0.72,
        fill: `url(#start-core-${t.id})`
      })
    ]);
  }
};
const tf = {
  type: "start",
  model: Qc,
  view: ef
};
let of = class extends cr {
  initNodeData(t) {
    super.initNodeData(t), this.width = 100, this.height = 80, this.radius = 8;
  }
  getNodeStyle() {
    const t = ze(super.getNodeStyle(), this.properties, "node");
    return We(t, this.properties, "64,158,255");
  }
}, nf = class extends ur {
  /** 现代化审批/任务图标 */
  getIconShape() {
    const { model: t } = this.props, { x: o, y: r } = t, l = t.getNodeStyle()._statusColorRGB || "166,178,189", s = typeof document < "u" && document.documentElement.classList.contains("dark"), d = o - 46, a = r - 34;
    return C(
      "svg",
      {
        x: d,
        y: a,
        width: 26,
        height: 26,
        viewBox: "0 0 24 24"
      },
      [
        // 圆角矩形卡片背景（暗黑模式加深）
        C("rect", {
          x: 2,
          y: 3,
          width: 18,
          height: 16,
          rx: 3,
          ry: 3,
          fill: `rgba(${l}, ${s ? 0.15 : 0.08})`,
          stroke: `rgb(${l})`,
          strokeWidth: 1.2,
          strokeLinejoin: "round"
        }),
        // 对勾或用户标识（暗黑模式加深）
        C("circle", {
          cx: 11,
          cy: 10,
          r: 3.5,
          fill: `rgba(${l}, ${s ? 0.25 : 0.15})`,
          stroke: `rgb(${l})`,
          strokeWidth: 1
        }),
        C("path", {
          d: "M9 10 l2 2 l4 -4",
          fill: "none",
          stroke: `rgb(${l})`,
          strokeWidth: 1.5,
          strokeLinecap: "round",
          strokeLinejoin: "round"
        }),
        // 底部线条装饰（暗黑模式可见度提升）
        C("line", {
          x1: 6,
          y1: 16.5,
          x2: 16,
          y2: 16.5,
          stroke: `rgba(${l}, ${s ? 0.4 : 0.25})`,
          strokeWidth: 1,
          strokeLinecap: "round"
        })
      ]
    );
  }
  // 自定义节点外观
  getShape() {
    const { model: t } = this.props, { x: o, y: r, width: n, height: l, radius: s } = t, d = t.getNodeStyle(), a = d._statusColorRGB || "166,178,189", i = typeof document < "u" && document.documentElement.classList.contains("dark");
    return C("g", { style: { cursor: "pointer" } }, [
      // 定义渐变和滤镜
      C("defs", {}, [
        // 卡片背景填充（暗黑模式适配）
        C("linearGradient", { id: `card-bg-${t.id}`, x1: "0%", y1: "0%", x2: "0%", y2: "100%" }, [
          C("stop", { offset: "0%", stopColor: i ? `rgba(${a}, 0.06)` : "#ffffff" }),
          C("stop", { offset: "100%", stopColor: i ? `rgba(${a}, 0.03)` : "#f8fafc" })
        ]),
        // 卡片阴影（暗黑模式加深）
        C("filter", { id: `card-shadow-${t.id}`, x: "-20%", y: "-20%", width: "140%", height: "140%" }, [
          C("feDropShadow", { dx: 0, dy: 3, stdDeviation: 6, floodColor: "#000", floodOpacity: i ? 0.4 : 0.05 }),
          C("feDropShadow", { dx: 0, dy: 1, stdDeviation: 2, floodColor: "#000", floodOpacity: i ? 0.2 : 0.025 })
        ]),
        // 顶部光泽渐变（暗黑模式减弱）
        C("linearGradient", { id: `card-top-${t.id}`, x1: "0%", y1: "0%", x2: "100%", y2: "0%" }, [
          C("stop", { offset: "0%", stopColor: `rgba(${a}, ${i ? 0.06 : 0.12})` }),
          C("stop", { offset: "50%", stopColor: `rgba(${a}, ${i ? 0.02 : 0.03})` }),
          C("stop", { offset: "100%", stopColor: "rgba(255,255,255,0)" })
        ])
      ]),
      // 主卡片矩形（暗黑模式使用深色渐变填充）
      C("rect", {
        x: o - n / 2,
        y: r - l / 2,
        rx: s,
        ry: s,
        width: n,
        height: l,
        fill: i ? `url(#card-bg-${t.id})` : d.fill,
        stroke: d.stroke,
        strokeWidth: d.strokeWidth || 1.5,
        strokeLinejoin: "round",
        filter: `url(#card-shadow-${t.id})`
      }),
      // 顶部渐变光泽条
      C("rect", {
        x: o - n / 2 + 1,
        y: r - l / 2 + 1,
        rx: s,
        ry: s,
        width: n - 2,
        height: l * 0.18,
        fill: `url(#card-top-${t.id})`,
        clipPath: `inset(0 0 ${l * 0.82}px 0 round ${s}px)`
      }),
      // 图标
      this.getIconShape()
    ]);
  }
};
const rf = {
  type: "between",
  model: of,
  view: nf
};
var No;
let lf = (No = class extends Ho {
  constructor(t, o) {
    t.text || (t.text = ""), t.text && typeof t.text == "string" && (t.text = {
      value: t.text,
      x: t.x,
      y: t.y + 40
    }), super(t, o), this.points = [
      [25, 0],
      [50, 25],
      [25, 50],
      [0, 25]
    ];
  }
  getNodeStyle() {
    const t = ze(super.getNodeStyle(), this.properties, "node");
    return We(t, this.properties, "245,158,11"), t.fill = t._statusRgba ? t._statusRgba(0.06) : "rgba(166,178,189,0.06)", t.strokeWidth = 2, t;
  }
}, Ze(No, "extendKey", "SerialModel"), No);
var Io;
let sf = (Io = class extends Wo {
  getShape() {
    const { model: t } = this.props, { x: o, y: r, width: n, height: l, points: s } = t, d = t.getNodeStyle();
    return d._statusColorRGB, C(
      "g",
      {
        transform: `matrix(1 0 0 1 ${o - n / 2} ${r - l / 2})`
      },
      [
        // 定义滤镜
        C("defs", {}, [
          C("filter", { id: `gw-shadow-${t.id}`, x: "-30%", y: "-30%", width: "160%", height: "160%" }, [
            C("feDropShadow", { dx: 0, dy: 2, stdDeviation: 3, floodColor: "#000", floodOpacity: 0.05 })
          ])
        ]),
        // 菱形底座
        C("polygon", {
          ...d,
          x: o,
          y: r,
          points: s,
          filter: `url(#gw-shadow-${t.id})`
        }),
        // X 图标（居中 + 加粗 + 两端圆点装饰）
        C(
          "g",
          {},
          // 主 X 形：以节点中心 (25, 25) 对称绘制，端点距菱形边缘留充足内边距
          C("path", {
            d: "M17 17 L33 33 M33 17 L17 33",
            fill: "none",
            stroke: d.stroke || "#666",
            strokeWidth: 2.5,
            strokeLinecap: "round",
            strokeLinejoin: "round"
          }),
          // 四端小装饰圆点（跟随 X 端点外侧）
          C("circle", { cx: 15.5, cy: 15.5, r: 1.3, fill: d._statusHex || "#666" }),
          C("circle", { cx: 34.5, cy: 15.5, r: 1.3, fill: d._statusHex || "#666" }),
          C("circle", { cx: 34.5, cy: 34.5, r: 1.3, fill: d._statusHex || "#666" }),
          C("circle", { cx: 15.5, cy: 34.5, r: 1.3, fill: d._statusHex || "#666" })
        )
      ]
    );
  }
}, Ze(Io, "extendKey", "SerialNode"), Io);
const af = {
  type: "serial",
  view: sf,
  model: lf
};
var Eo;
let df = (Eo = class extends Ho {
  constructor(t, o) {
    t.text || (t.text = ""), t.text && typeof t.text == "string" && (t.text = {
      value: t.text,
      x: t.x,
      y: t.y + 40
    }), super(t, o), this.points = [
      [25, 0],
      [50, 25],
      [25, 50],
      [0, 25]
    ];
  }
  getNodeStyle() {
    const t = ze(super.getNodeStyle(), this.properties, "node");
    return We(t, this.properties, "19,194,194"), t.fill = t._statusRgba ? t._statusRgba(0.06) : "rgba(166,178,189,0.06)", t.strokeWidth = 2, t;
  }
}, Ze(Eo, "extendKey", "ParallelModel"), Eo);
var To;
let uf = (To = class extends Wo {
  getShape() {
    const { model: t } = this.props, { x: o, y: r, width: n, height: l, points: s } = t, d = t.getNodeStyle();
    return d._statusColorRGB, C(
      "g",
      {
        transform: `matrix(1 0 0 1 ${o - n / 2} ${r - l / 2})`
      },
      [
        // 定义滤镜
        C("defs", {}, [
          C("filter", { id: `gw-shadow-p-${t.id}`, x: "-30%", y: "-30%", width: "160%", height: "160%" }, [
            C("feDropShadow", { dx: 0, dy: 2, stdDeviation: 3, floodColor: "#000", floodOpacity: 0.05 })
          ])
        ]),
        // 菱形底座
        C("polygon", {
          ...d,
          x: o,
          y: r,
          points: s,
          filter: `url(#gw-shadow-p-${t.id})`
        }),
        // + 图标（加粗 + 四臂末端圆角装饰，与菱形边缘保持间距）
        C(
          "g",
          {},
          // 横线（两端带圆角端点）
          C("path", {
            d: "M16 25 L34 25",
            fill: "none",
            stroke: d.stroke || "#666",
            strokeWidth: 3,
            strokeLinecap: "round"
          }),
          // 竖线
          C("path", {
            d: "M25 16 L25 34",
            fill: "none",
            stroke: d.stroke || "#666",
            strokeWidth: 3,
            strokeLinecap: "round"
          }),
          // 四臂末端装饰圆点（跟随线段端点外侧）
          C("circle", { cx: 25, cy: 14, r: 1.5, fill: d._statusHex || "#666" }),
          C("circle", { cx: 36, cy: 25, r: 1.5, fill: d._statusHex || "#666" }),
          C("circle", { cx: 25, cy: 36, r: 1.5, fill: d._statusHex || "#666" }),
          C("circle", { cx: 14, cy: 25, r: 1.5, fill: d._statusHex || "#666" })
        )
      ]
    );
  }
}, Ze(To, "extendKey", "ParallelNode"), To);
const cf = {
  type: "parallel",
  view: uf,
  model: df
};
var Po;
let ff = (Po = class extends Ho {
  constructor(t, o) {
    t.text || (t.text = ""), t.text && typeof t.text == "string" && (t.text = {
      value: t.text,
      x: t.x,
      y: t.y + 40
    }), super(t, o), this.points = [
      [25, 0],
      [50, 25],
      [25, 50],
      [0, 25]
    ];
  }
  getNodeStyle() {
    const t = ze(super.getNodeStyle(), this.properties, "node");
    return We(t, this.properties, "146,84,222"), t.fill = t._statusRgba ? t._statusRgba(0.06) : "rgba(166,178,189,0.06)", t.strokeWidth = 2, t;
  }
}, Ze(Po, "extendKey", "InclusiveModel"), Po);
var $o;
let pf = ($o = class extends Wo {
  getShape() {
    const { model: t } = this.props, { x: o, y: r, width: n, height: l, points: s } = t, d = t.getNodeStyle(), a = d._statusColorRGB || "166,178,189";
    return C(
      "g",
      {
        transform: `matrix(1 0 0 1 ${o - n / 2} ${r - l / 2})`
      },
      [
        // 定义滤镜
        C("defs", {}, [
          C("filter", { id: `gw-shadow-i-${t.id}`, x: "-30%", y: "-30%", width: "160%", height: "160%" }, [
            C("feDropShadow", { dx: 0, dy: 2, stdDeviation: 3, floodColor: "#000", floodOpacity: 0.05 })
          ])
        ]),
        // 菱形底座
        C("polygon", {
          ...d,
          x: o,
          y: r,
          points: s,
          filter: `url(#gw-shadow-i-${t.id})`
        }),
        // 同心双圆图标（替代原来的单圆）
        C(
          "g",
          {},
          // 外圆
          C("circle", {
            cx: 25,
            cy: 25,
            r: 11,
            fill: "none",
            stroke: d.stroke || "#666",
            strokeWidth: 2
          }),
          // 内圆（增加识别度）
          C("circle", {
            cx: 25,
            cy: 25,
            r: 5.5,
            fill: `rgba(${a}, 0.15)`,
            stroke: d.stroke || "#666",
            strokeWidth: 1.5
          }),
          // 内圆中心微点缀
          C("circle", {
            cx: 25,
            cy: 25,
            r: 1.8,
            fill: d._statusHex || "#666"
          })
        )
      ]
    );
  }
}, Ze($o, "extendKey", "InclusiveNode"), $o);
const hf = {
  type: "inclusive",
  view: pf,
  model: ff
};
let mf = class extends jo {
  initNodeData(t) {
    super.initNodeData(t), this.r = 25;
  }
  getNodeStyle() {
    const t = ze(super.getNodeStyle(), this.properties, "node");
    return We(t, this.properties, "245,108,108"), t.strokeWidth = 3, t;
  }
}, vf = class extends qo {
  getShape() {
    const { model: t } = this.props, { x: o, y: r, r: n } = t, s = t.getNodeStyle()._statusColorRGB || "166,178,189", d = typeof document < "u" && document.documentElement.classList.contains("dark");
    return C("g", {}, [
      // 定义渐变和滤镜
      C("defs", {}, [
        // 外环渐变
        C("linearGradient", { id: `end-grad-${t.id}`, x1: "0%", y1: "0%", x2: "100%", y2: "100%" }, [
          C("stop", { offset: "0%", stopColor: `rgb(${s})` }),
          C("stop", { offset: "100%", stopColor: `rgba(${s}, 0.45)` })
        ]),
        // 内圈填充渐变（暗黑模式适配：加深底色让节点不刺眼）
        C("radialGradient", { id: `end-fill-${t.id}`, cx: "50%", cy: "50%", r: "60%" }, [
          C("stop", { offset: "0%", stopColor: d ? `rgba(${s}, 0.15)` : `rgba(${s}, 0.08)` }),
          C("stop", { offset: "100%", stopColor: d ? "#181a20" : "rgba(248,250,252,0.98)" })
        ]),
        // 双环阴影/发光（柔和）
        C("filter", { id: `end-shadow-${t.id}`, x: "-30%", y: "-30%", width: "160%", height: "160%" }, [
          C("feDropShadow", { dx: 0, dy: 2, stdDeviation: 3, floodColor: `rgb(${s})`, floodOpacity: d ? 0.18 : 0.1 })
        ])
      ]),
      // 外层光晕（柔和不抢眼）
      C("circle", {
        cx: o,
        cy: r,
        r: n + 4,
        fill: `rgba(${s}, ${d ? 0.05 : 0.02})`
      }),
      // 内圈填充（暗黑模式使用深色基底）
      C("circle", {
        cx: o,
        cy: r,
        r: n - 1,
        fill: `url(#end-fill-${t.id})`
      }),
      // 粗外环（主视觉）
      C("circle", {
        cx: o,
        cy: r,
        r: n,
        fill: "none",
        stroke: `url(#end-grad-${t.id})`,
        strokeWidth: 3.5,
        filter: `url(#end-shadow-${t.id})`,
        style: { cursor: "pointer" }
      }),
      // 细内环装饰
      C("circle", {
        cx: o,
        cy: r,
        r: n * 0.72,
        fill: "none",
        stroke: `rgba(${s}, ${d ? 0.35 : 0.25})`,
        strokeWidth: 1
      })
    ]);
  }
};
const gf = {
  type: "end",
  model: mf,
  view: vf
};
let wf = class extends ml {
  setAttributes() {
    this.offset = 20;
  }
  getEdgeStyle() {
    return ze(super.getEdgeStyle(), this.properties, "skip");
  }
  getTextStyle() {
    const t = super.getTextStyle(), o = document.documentElement.classList.contains("dark");
    return t.background = { fill: o ? "#1e1e1e" : "#ffffff" }, t.fill = o ? "#cbd5e1" : "#374151", t.fontSize = 12, t.fontWeight = 400, t.style || (t.style = {}), t.style.padding = "2px 8px", t;
  }
  /**
   * 重写此方法，使保存数据是能带上锚点数据。
   */
  getData() {
    const t = super.getData();
    return t.sourceAnchorId = this.sourceAnchorId, t.targetAnchorId = this.targetAnchorId, t;
  }
};
const yf = {
  type: "skip",
  view: hl,
  model: wf
};
class rl extends vl {
  setAttributes() {
    this.width = 220, this.height = 80, this.radius = 20, this.inputData = this.text.value;
  }
  getNodeStyle() {
    return ze(super.getNodeStyle(), this.properties, "node", "mimic");
  }
  getData() {
    const t = super.getData();
    return t.text.value = this.inputData, t;
  }
  getTextStyle() {
    const t = super.getTextStyle();
    return t.display = "none", t;
  }
}
const bf = (e) => (ot("data-v-127a6dfe"), e = e(), nt(), e), _f = {
  t: "1753861236923",
  class: "edit-icon",
  viewBox: "0 0 1024 1024",
  version: "1.1",
  xmlns: "http://www.w3.org/2000/svg",
  "p-id": "1784",
  width: "16",
  height: "16"
}, kf = /* @__PURE__ */ bf(() => /* @__PURE__ */ v("path", {
  d: "M469.333333 128a42.666667 42.666667 0 0 1 0 85.333333H213.333333v597.333334h597.333334v-256l0.298666-4.992A42.666667 42.666667 0 0 1 896 554.666667v256a85.333333 85.333333 0 0 1-85.333333 85.333333H213.333333a85.333333 85.333333 0 0 1-85.333333-85.333333V213.333333a85.333333 85.333333 0 0 1 85.333333-85.333333z m414.72 12.501333a42.666667 42.666667 0 0 1 0 60.330667L491.861333 593.066667a42.666667 42.666667 0 0 1-60.330666-60.330667l392.192-392.192a42.666667 42.666667 0 0 1 60.330666 0z",
  fill: "#000000",
  "p-id": "1785"
}, null, -1)), xf = [
  kf
], Cf = ["onClick"], Sf = ["title"], Nf = /* @__PURE__ */ be({
  name: "BaseInfo",
  __name: "baseNode",
  props: {
    text: { default: "" },
    permissionFlag: { default: "" },
    chartStatusColor: { default: () => [] },
    status: { default: null },
    type: { default: "" },
    fill: { default: "" },
    stroke: { default: "" }
  },
  emits: ["updateNodeName", "deleteNode", "editNode"],
  setup(e, { emit: t }) {
    const { t: o } = xe(), r = e, n = D(!0), l = D(null), s = D(o("baseNode.initiator")), d = D(o("baseNode.everyone")), a = D(null), i = D(!1), u = t, f = le(() => r.chartStatusColor && r.chartStatusColor.length > 0), p = le(() => typeof window < "u" && !!window.__WF_DESIGNER_DISABLED__), b = le(() => !f.value && !p.value), y = le(() => f.value ? {
      border: (r.status === 1 ? "2px dashed " : "1px solid ") + (r.stroke || "rgb(166,178,189)")
    } : {
      background: "var(--wf-bg-white, #fff)"
    }), w = {
      start: "linear-gradient(135deg, #67c23a 0%, #5daf34 100%)",
      end: "linear-gradient(135deg, #f56c6c 0%, #e85c5c 100%)"
    }, k = le(() => f.value ? { backgroundColor: r.stroke || "rgb(166,178,189)" } : { background: w[r.type] || "linear-gradient(135deg, #409eff 0%, #2b7de9 100%)" }), F = () => {
      u("deleteNode");
    };
    de(
      () => r.text,
      (E) => {
        E && (s.value = E);
      },
      { immediate: !0 }
    ), de(
      () => r.permissionFlag,
      (E) => {
        E ? ln({ storageIds: E.split("@@") }).then((M) => {
          M.code === 200 && M.data && (d.value = M.data.map((K) => K.handlerName).join("、"));
        }) : d.value = o("baseNode.everyone");
      },
      { immediate: !0 }
    );
    const m = () => {
      b.value && (i.value = !0, n.value = !1);
    }, T = () => {
      b.value && (i.value = !1, n.value = !0, u("updateNodeName", s.value));
    }, O = () => {
      u("editNode");
    };
    function N() {
      i.value = !1, n.value = !0;
    }
    return (E, M) => {
      const K = ir("click-outside");
      return _(), V("div", {
        style: He(y.value),
        class: "base-node",
        ref_key: "baseNodeDiv",
        ref: l
      }, [
        ke((_(), V("div", {
          style: He(k.value),
          class: "top-section"
        }, [
          ke(v("span", { onClick: m }, [
            Se(A(s.value) + " ", 1),
            ke((_(), V("svg", _f, xf, 512)), [
              [Ne, b.value]
            ])
          ], 512), [
            [Ne, n.value]
          ]),
          ke(v("input", {
            ref_key: "nodeNameInput",
            ref: a,
            "onUpdate:modelValue": M[0] || (M[0] = (z) => s.value = z),
            onBlur: T
          }, null, 544), [
            [Ne, i.value],
            [cl, s.value]
          ]),
          ke(v("span", {
            class: "delete-btn",
            onClick: dr(F, ["stop"])
          }, "✕", 8, Cf), [
            [Ne, r.type === "between" && b.value]
          ])
        ], 4)), [
          [K, N]
        ]),
        v("div", {
          class: "bottom-section",
          onClick: O,
          title: d.value
        }, A(d.value), 9, Sf)
      ], 4);
    };
  }
}), If = /* @__PURE__ */ Ee(Nf, [["__scopeId", "data-v-127a6dfe"]]);
class ll extends gl {
  constructor(t) {
    super(t), this.isMounted = !1, this.r = Ut(If, {
      text: t.model.inputData,
      permissionFlag: t.model.properties.permissionFlag,
      chartStatusColor: t.model.properties.chartStatusColor,
      status: t.model.properties.status,
      type: t.model.type,
      fill: t.model.getNodeStyle().fill,
      stroke: t.model.getNodeStyle().stroke,
      onUpdateNodeName: (r) => {
        t.model.text.value = r, t.graphModel.eventCenter.emit("update:nodeName", { id: t.model.id, nodeName: r });
      },
      onEditNode: () => {
        t.graphModel.eventCenter.emit("edit:node", { id: t.model.id, click: !0 });
      },
      onDeleteNode: () => {
        t.graphModel.eventCenter.emit("delete:node", { id: t.model.id });
      }
    }), this.app = fl({
      render: () => this.r
    });
    const o = ht().clickOutside;
    o && this.app.directive("click-outside", o);
  }
  shouldUpdate() {
    const t = JSON.parse(this.currentProperties);
    if (this.preProperties) {
      const o = JSON.parse(this.preProperties);
      let r = !1;
      return t.permissionFlag !== o.permissionFlag && (this.preProperties = this.currentProperties, r = !0), this.props.model.text.value !== this.preText && (this.preText = this.props.model.text.value, r = !0), r;
    }
    return this.preProperties = this.currentProperties, this.preText = this.props.model.text.value, !0;
  }
  setHtml(t) {
    if (this.isMounted)
      this.r.component.props.text = this.props.model.text.value, this.r.component.props.permissionFlag = this.props.model.properties.permissionFlag;
    else {
      this.isMounted = !0;
      const o = document.createElement("div");
      t.appendChild(o), this.app.mount(o);
    }
  }
}
class Ef extends rl {
}
class Tf extends ll {
}
const Pf = {
  type: "start",
  model: Ef,
  view: Tf
};
class $f extends rl {
}
class Lf extends ll {
}
const Rf = {
  type: "between",
  model: $f,
  view: Lf
};
class cn extends cr {
  initNodeData(t) {
    super.initNodeData(t), this.width = 70, this.height = 30, this.radius = 5;
  }
  getNodeStyle() {
    return ze(super.getNodeStyle(), this.properties, "node", "mimic");
  }
  getTextStyle() {
    const t = super.getTextStyle();
    return t.display = "none", t;
  }
}
class fn extends ur {
  getLabelShape() {
    const { model: t } = this.props, { x: o, y: r, width: n, height: l, text: s } = t, d = t.getNodeStyle();
    return t.graphModel.getNodeIncomingEdge(t.id).length > 1 ? C(
      "svg",
      {
        x: o - n / 2 + 23,
        y: r - l / 2 + 3,
        width: 25,
        height: 25,
        viewBox: "0 0 1024 1024"
      },
      [
        // 多个输入边时的图标
        C("path", {
          fill: d.stroke ? d.stroke : "#409eff",
          d: "M171.52 280.064H51.2c-28.672 0-51.2-22.528-51.2-51.2V108.544c0-28.672 22.528-51.2 51.2-51.2h120.32c28.672 0 51.2 22.528 51.2 51.2v120.32c0 28.672-22.528 51.2-51.2 51.2zM51.2 108.544v120.32h120.32V108.544H51.2zM572.416 280.064H451.584c-28.672 0-51.2-22.528-51.2-51.2V108.544c0-28.672 22.528-51.2 51.2-51.2h120.32c28.672 0 51.2 22.528 51.2 51.2v119.808c0.512 13.312-4.608 26.112-13.824 35.84-9.728 10.24-23.04 15.872-36.864 15.872z m-0.512-50.176zM451.584 108.544v120.32h120.32V108.544H451.584zM972.8 280.064h-120.32c-28.672 0-51.2-22.528-51.2-51.2V108.544c0-28.672 22.528-51.2 51.2-51.2H972.8c28.672 0 51.2 22.528 51.2 51.2v120.32c0 28.672-22.528 51.2-51.2 51.2z m-120.32-171.52v120.32H972.8V108.544h-120.32zM572.416 966.656H451.584c-28.672 0-51.2-22.528-51.2-51.2v-120.32c0-28.672 22.528-51.2 51.2-51.2h120.32c28.672 0 51.2 22.528 51.2 51.2v119.808c0.512 13.312-4.608 26.112-13.824 35.84-9.728 10.24-23.04 15.872-36.864 15.872z m-0.512-50.176z m-120.32-121.344v120.32h120.32v-120.32H451.584z"
        }),
        C("path", {
          fill: d.stroke ? d.stroke : "#409eff",
          d: "M861.696 566.272H162.816c-42.496 0-76.8-34.304-76.8-76.8V254.464c0-14.336 11.264-25.6 25.6-25.6s25.6 11.264 25.6 25.6v235.008c0 14.336 11.264 25.6 25.6 25.6h698.88c14.336 0 25.6-11.264 25.6-25.6V254.464c0-14.336 11.264-25.6 25.6-25.6s25.6 11.264 25.6 25.6v235.008c0 42.496-34.304 76.8-76.8 76.8z"
        }),
        C("path", {
          fill: d.stroke ? d.stroke : "#409eff",
          d: "M512 766.464c-14.336 0-25.6-11.264-25.6-25.6V283.136c0-14.336 11.264-25.6 25.6-25.6s25.6 11.264 25.6 25.6v457.728c0 14.336-11.264 25.6-25.6 25.6z"
        })
      ]
    ) : this.getSvg(o, r, n, l, s.value, d);
  }
  // 自定义节点外观
  getShape() {
    const { model: t } = this.props, { x: o, y: r, width: n, height: l, radius: s } = t, d = t.getNodeStyle();
    return C("g", { style: {
      cursor: "pointer"
    } }, [
      C("rect", {
        ...d,
        x: o - n / 2,
        // 矩形默认x，y代表左上角顶点坐标，切换为中心点
        y: r - l / 2,
        rx: s,
        ry: s,
        width: n,
        height: l
      }),
      this.getLabelShape()
    ]);
  }
}
class Df extends cn {
  // 设计态：串行(互斥)网关用橙色语义色，与经典模式一致；运行态进度图沿用状态色不受影响
  getNodeStyle() {
    const t = super.getNodeStyle();
    return We(t, this.properties, "245,158,11"), typeof window < "u" && window.__WF_FLOW_DESIGN_MODE__ && typeof t._statusRgba == "function" && (t.fill = t._statusRgba(0.12)), t;
  }
}
class Vf extends fn {
  getSvg(t, o, r, n, l, s) {
    return C("g", {}, [
      // 图标 SVG
      C("svg", {
        x: t - r / 2,
        y: o - n / 2 + 3,
        width: 25,
        height: 25,
        viewBox: "0 0 1024 1024"
      }, [
        // 单个输入边时的图标
        C("path", {
          fill: s.fill ? s.fill : "#ecf5ff",
          d: "M85.418667 512L512.021333 85.397333 938.624 512 512.021333 938.602667z"
        }),
        C("path", {
          fill: s.stroke ? s.stroke : "#409eff",
          d: "M512 970.24a66.346667 66.346667 0 0 1-47.146667-19.413333L72.96 558.72a66.346667 66.346667 0 0 1 0-94.08L464.853333 72.533333a68.266667 68.266667 0 0 1 94.293334 0l392.106666 392.106667a66.773333 66.773333 0 0 1 0 94.08L559.146667 950.826667a66.346667 66.346667 0 0 1-47.146667 19.413333z m0-853.333333a2.986667 2.986667 0 0 0-1.92 0L118.186667 509.866667a2.56 2.56 0 0 0 0 3.626666l391.893333 392.106667a3.2 3.2 0 0 0 3.84 0l391.893333-392.106667a2.56 2.56 0 0 0 0-3.626666L513.92 117.76a2.986667 2.986667 0 0 0-1.92-0.64z"
        }),
        C("path", {
          fill: s.stroke ? s.stroke : "#409eff",
          d: "M554.666667 516.266667l107.946666-107.946667a30.506667 30.506667 0 0 0-42.666666-42.666667L512 473.173333l-107.946667-107.946666a30.506667 30.506667 0 0 0-42.666666 42.666666L469.333333 516.266667l-108.8 107.946666a30.506667 30.506667 0 1 0 42.666667 42.666667l108.8-107.306667 106.666667 107.733334a30.506667 30.506667 0 0 0 42.666666-42.666667z"
        })
      ]),
      // 文本元素，相对于g元素定位
      l ? C("text", {
        x: t - r / 2 + 27,
        y: o - n / 2 + 20,
        fontSize: 13,
        style: {
          userSelect: "none",
          fill: "var(--wf-text-primary, #303133)"
        }
      }, l) : null
    ]);
  }
}
const Mf = {
  type: "serial",
  view: Vf,
  model: Df
};
class Of extends cn {
  // 设计态：并行网关用青色语义色，与经典模式一致；运行态进度图沿用状态色不受影响
  getNodeStyle() {
    const t = super.getNodeStyle();
    return We(t, this.properties, "19,194,194"), typeof window < "u" && window.__WF_FLOW_DESIGN_MODE__ && typeof t._statusRgba == "function" && (t.fill = t._statusRgba(0.12)), t;
  }
}
class Ff extends fn {
  getSvg(t, o, r, n, l, s) {
    return C("g", {}, [
      // 图标 SVG
      C("svg", {
        x: t - r / 2,
        y: o - n / 2 + 3,
        width: 25,
        height: 25,
        viewBox: "0 0 1024 1024"
      }, [
        C("path", {
          fill: s.fill ? s.fill : "#ecf5ff",
          d: "M85.418667 512L512.021333 85.397333 938.624 512 512.021333 938.602667z"
        }),
        C("path", {
          fill: s.stroke ? s.stroke : "#409eff",
          d: "M512 714.453333A32 32 0 0 1 480 682.666667v-138.666667H341.333333a32 32 0 1 1 0-64h138.666667V341.333333a32 32 0 0 1 64 0v138.666667H682.666667a32 32 0 0 1 0 64h-138.666667V682.666667a32 32 0 0 1-32 31.786666z"
        }),
        C("path", {
          fill: s.stroke ? s.stroke : "#409eff",
          d: "M512 970.453333a66.56 66.56 0 0 1-47.146667-19.626666L72.96 558.933333a66.346667 66.346667 0 0 1 0-94.293333L464.853333 72.533333a68.266667 68.266667 0 0 1 94.293334 0l391.893333 392.106667a66.346667 66.346667 0 0 1 0 94.293333L559.146667 950.826667a66.56 66.56 0 0 1-47.146667 19.626666z m0-853.333333a2.986667 2.986667 0 0 0-1.92 0L118.186667 509.866667a2.56 2.56 0 0 0 0 3.626666l391.893333 392.106667a3.2 3.2 0 0 0 3.84 0l391.893333-392.106667a2.986667 2.986667 0 0 0 0-3.626666L513.92 117.76a2.986667 2.986667 0 0 0-1.92-0.64z"
        })
      ]),
      // 文本元素，相对于g元素定位
      l ? C("text", {
        x: t - r / 2 + 27,
        y: o - n / 2 + 20,
        fontSize: 13,
        style: {
          userSelect: "none",
          fill: "var(--wf-text-primary, #303133)"
        }
      }, l) : null
    ]);
  }
}
const Af = {
  type: "parallel",
  view: Ff,
  model: Of
};
class Bf extends cn {
  // 设计态：包容网关用紫色语义色，与经典模式一致；运行态进度图沿用状态色不受影响
  getNodeStyle() {
    const t = super.getNodeStyle();
    return We(t, this.properties, "146,84,222"), typeof window < "u" && window.__WF_FLOW_DESIGN_MODE__ && typeof t._statusRgba == "function" && (t.fill = t._statusRgba(0.12)), t;
  }
}
class Uf extends fn {
  getSvg(t, o, r, n, l, s) {
    return C("g", {}, [
      // 图标 SVG
      C("svg", {
        x: t - r / 2,
        y: o - n / 2 + 3,
        width: 25,
        height: 25,
        viewBox: "0 0 1024 1024"
      }, [
        // 单个输入边时的图标
        C("path", {
          fill: s.fill ? s.fill : "#ecf5ff",
          d: "M85.418667 512L512.021333 85.397333 938.624 512 512.021333 938.602667z"
        }),
        C("path", {
          fill: s.stroke ? s.stroke : "#409eff",
          d: "M512 970.24a66.346667 66.346667 0 0 1-47.146667-19.413333L72.96 558.72a66.346667 66.346667 0 0 1 0-94.08L464.853333 72.533333a68.266667 68.266667 0 0 1 94.293334 0l392.106666 392.106667a66.773333 66.773333 0 0 1 0 94.08L559.146667 950.826667a66.346667 66.346667 0 0 1-47.146667 19.413333z m0-853.333333a2.986667 2.986667 0 0 0-1.92 0L118.186667 509.866667a2.56 2.56 0 0 0 0 3.626666l391.893333 392.106667a3.2 3.2 0 0 0 3.84 0l391.893333-392.106667a2.56 2.56 0 0 0 0-3.626666L513.92 117.76a2.986667 2.986667 0 0 0-1.92-0.64z"
        }),
        C("circle", {
          cx: 512,
          cy: 512,
          r: 200,
          fill: "none",
          stroke: s.stroke ? s.stroke : "#409eff",
          strokeWidth: 60
        })
      ]),
      // 文本元素，相对于g元素定位
      l ? C("text", {
        x: t - r / 2 + 27,
        y: o - n / 2 + 20,
        fontSize: 13,
        style: {
          userSelect: "none",
          fill: "var(--wf-text-primary, #303133)"
        }
      }, l) : null
    ]);
  }
}
const zf = {
  type: "inclusive",
  view: Uf,
  model: Bf
};
class qf extends jo {
  initNodeData(t) {
    super.initNodeData(t), this.r = 20;
  }
  getNodeStyle() {
    const t = ze(super.getNodeStyle(), this.properties, "node", "mimic");
    return t.strokeWidth = 4, t;
  }
}
class jf extends qo {
}
const Hf = {
  type: "end",
  model: qf,
  view: jf
};
class Wf extends wl {
  setAttributes() {
    this.isHitable = !1;
  }
  getEdgeStyle() {
    return ze(super.getEdgeStyle(), this.properties, "skip", "mimic");
  }
  // getTextPosition() {
  //   const position = super.getTextPosition();
  //
  //   const currentPositionList = this.points.split(' ');
  //
  //   // 取最后两个点，用于判断终点方向
  //   const lastTwoPoints = currentPositionList.slice(-2);
  //   const [x2, y2] = lastTwoPoints[1].split(',').map(Number);
  //
  //   // 设置文本位置
  //   position.x = x2;
  //   position.y = y2 - 30;
  //
  //   return position;
  // }
  getTextStyle() {
    const t = super.getTextStyle();
    return t.display = "none", t.background = { fill: "transparent" }, t;
  }
  /**
   * 重写此方法，使保存数据是能带上锚点数据。
   */
  getData() {
    const t = super.getData();
    return t.sourceAnchorId = this.sourceAnchorId, t.targetAnchorId = this.targetAnchorId, t;
  }
}
class Gf extends yl {
  getEdge() {
    const { model: t } = this.props, { points: o, isAnimation: r, arrowConfig: n, radius: l = 0 } = t, s = t.getEdgeStyle(), d = t.getEdgeAnimationStyle(), a = t.properties.chartStatusColor ? s.stroke : "#409eff";
    let i = this.pointFilter(o.split(" ").map((y) => y.split(",").map((w) => +w))), u = bl(i, l), f = [];
    const p = 30;
    if (i.length === 2) {
      let y = t.graphModel.edges.filter((w) => w.sourceNodeId === t.sourceNode.id);
      if (["serial", "inclusive"].includes(t.sourceNode.type) && y.length > 1) {
        const w = [i[0][0], i[0][1] + p - 10];
        f = this.getForeignObject(w, a, t.text.value);
      } else if (!t.properties.chartStatusColor) {
        const w = [i[0][0], i[0][1] + p];
        f = this.getPlusElements(w);
      }
    } else {
      const y = i[0], w = i[1], k = i[2];
      if (y[0] === w[0] && y[1] !== w[1] && !t.properties.chartStatusColor) {
        const F = [y[0], y[1] + p];
        f = this.getPlusElements(F);
      }
      if (t.sourceNode && ["serial", "inclusive"].includes(t.sourceNode.type) && y[1] === w[1] && y[0] !== w[0]) {
        const F = [k[0], w[1] + p];
        f = this.getForeignObject(F, a, t.text.value);
      }
    }
    let b = [];
    return b.push(C("path", {
      d: u,
      style: r ? d : {},
      ...s,
      ...n,
      fill: "none"
    })), C("g", {}, [...b, ...f]);
  }
  getForeignObject(t, o, r) {
    let n = [];
    if (n = [
      // 使用 SVG 图标代替原来的图形
      C("foreignObject", {
        x: t[0] - 16,
        y: t[1] - 20,
        width: 32,
        height: 32
      }, [
        C("div", {
          style: {
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: "100%",
            height: "100%"
          },
          innerHTML: `
<div style="width: 32px; height: 32px; transform: rotate(0deg); display: flex; align-items: center; justify-content: center;">
  <svg t="1751615394607" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="11883">
    <path d="M853.5 960.7h-683c-59.3 0-106-46.8-106-106v-683c0-59.3 46.8-106 106-106h682.9c59.3 0 106 46.8 106 106v682.9c0.1 59.3-49.8 106.1-105.9 106.1z" fill="${o}" p-id="11884"></path>
    <path d="M666.4 564.7c31.2 9.4 49.9 37.4 46.8 68.6-3.1 31.2-31.2 53-62.4 53s-59.3-21.8-62.4-53c-3.1-31.2 15.6-59.3 46.8-68.6v-65.5c0-9.4-6.2-15.6-15.6-15.6H401.3c-9.4 0-15.6 6.2-15.6 15.6v65.5c31.2 9.4 49.9 37.4 46.8 68.6-3.1 31.2-31.2 53-62.4 53s-59.3-21.8-62.4-53c-3.1-31.2 15.6-59.3 46.8-68.6v-81.1c0-18.7 12.5-31.2 31.2-31.2h109.1v-81.1c-31.2-9.4-49.9-37.4-46.8-68.6 3.1-31.2 31.2-53 62.4-53s59.3 21.8 62.4 53-15.6 59.3-46.8 68.6v81.1h109.1c18.7 0 31.2 12.5 31.2 31.2v81.1z m-156-218.3c18.7 0 31.2-12.5 31.2-31.2S529.1 284 510.4 284s-31.2 12.5-31.2 31.2c0.1 15.6 15.6 31.2 31.2 31.2zM370.1 655.1c18.7 0 31.2-12.5 31.2-31.2s-12.5-31.2-31.2-31.2-31.2 12.5-31.2 31.2 15.6 31.2 31.2 31.2z m280.7 0c18.7 0 31.2-12.5 31.2-31.2s-12.5-31.2-31.2-31.2-31.2 12.5-31.2 31.2 12.5 31.2 31.2 31.2z"
    fill="#FFFFFF" p-id="11885"></path>
  </svg>
</div>
`
        })
      ])
    ], r && r.trim().length > 0) {
      const a = Math.max(40, r.length * 8 + 10);
      n.push(
        C("rect", {
          x: t[0] - a / 2,
          y: t[1] + 10,
          width: a,
          height: 20,
          fill: "#fff",
          // 背景颜色
          rx: 3,
          // 圆角
          ry: 3
        })
      ), n.push(
        C("text", {
          x: t[0],
          y: t[1] + 25,
          fontSize: 13,
          fill: "#000",
          style: {
            userSelect: "none",
            textAnchor: "middle"
            // 文本居中对齐
          }
        }, `${r}`)
      );
    }
    return this.getAddElements(t, n, !0);
  }
  getPlusElements(t) {
    return typeof window < "u" && window.__WF_DESIGNER_DISABLED__ ? [] : this.getAddElements(t, null);
  }
  getAddElements(t, o, r = !1) {
    if (!o) {
      const l = t[0], s = t[1];
      o = [
        C("circle", {
          cx: l,
          cy: s,
          r: 13,
          fill: "#409eff"
        }),
        C("line", {
          x1: l - 8,
          y1: s,
          x2: l + 8,
          y2: s,
          stroke: "white",
          "stroke-width": "2"
        }),
        C("line", {
          x1: l,
          y1: s - 8,
          x2: l,
          y2: s + 8,
          stroke: "white",
          "stroke-width": "2"
        })
      ];
    }
    let n = [];
    return n.push(
      C("g", {
        ...this.getEventHandlers(r),
        // 根据 isCondition 动态选择事件处理器
        style: {
          pointerEvents: "auto",
          cursor: "pointer"
        }
      }, o)
    ), n;
  }
  // 新增方法：根据 isCondition 返回不同的事件处理器
  getEventHandlers(t) {
    return t ? {
      onClick: () => {
        this.props.graphModel.eventCenter.emit("show:EdgeSetting", { id: this.props.model.id });
      }
    } : {
      onMouseEnter: (o) => {
        this.props.graphModel.eventCenter.emit("show:EdgeTooltip", { e: o, id: this.props.model.id });
      },
      onMouseLeave: (o) => {
        setTimeout(() => {
          window.isTooltipHovered || this.props.graphModel.eventCenter.emit("hide:EdgeTooltip", o);
        }, 100);
      }
    };
  }
  pointFilter(t) {
    const o = t;
    let r = 1;
    for (; r < o.length - 1; ) {
      const [n, l] = o[r - 1], [s, d] = o[r], [a, i] = o[r + 1];
      n === s && s === a || l === d && d === i ? o.splice(r, 1) : r++;
    }
    return o;
  }
}
const Jf = {
  type: "skip",
  view: Gf,
  model: Wf
};
function Yf(e) {
  const { props: t, containerRef: o, logicJson: r, disabled: n, getBaseInfo: l, bindEvents: s, onReady: d } = e, a = D(null), { isDark: i, themeColors: u, applyDarkTheme: f } = nl(), p = () => window.innerWidth <= 1024 || "ontouchstart" in window && window.innerWidth <= 1280;
  function b() {
    var P;
    p() && ((P = a.value) != null && P.fitView) && a.value.fitView(40, 20);
  }
  function y() {
    const P = a.value;
    if (!(P != null && P.fitView))
      return;
    P.fitView(40, 20);
    const H = P.getTransform ? P.getTransform().SCALE_X : 1;
    H && H > 1 && (P.resetZoom ? P.resetZoom() : P.zoom(1), P.translateCenter && P.translateCenter());
  }
  function w() {
    const P = o.value;
    P && (oe(), a.value = new lt({
      container: P,
      // 只读（预览 / 已发布）时开启静默模式：禁止拖拽、连线、文本编辑、删除键等原生编辑交互
      isSilentMode: n.value,
      textEdit: !1,
      // 是否开启文本编辑。
      snapToGrid: !0,
      // 是否开启网格吸附，开启后拖动节点会有以网格大小为补步长移动
      hideAnchors: !Te(r.value.modelValue),
      // 是否隐藏节点的锚点，静默模式下默认隐藏。
      adjustNodePosition: Te(r.value.modelValue),
      // 是否允许拖动节点。
      hoverOutline: Te(r.value.modelValue),
      // 鼠标 hover 的时候是否显示节点的外框。
      nodeSelectedOutline: Te(r.value.modelValue),
      // 节点被选中时是否显示节点的外框。
      edgeSelectedOutline: Te(r.value.modelValue),
      //	边被选中时是否显示边的外框。
      grid: {
        size: 20,
        visible: t.showGrid,
        type: "dot",
        config: {
          color: u.value.gridColor,
          thickness: 1
        },
        background: {
          backgroundColor: u.value.bgPage
        }
      },
      keyboard: Te(r.value.modelValue) ? {
        enabled: !0,
        shortcuts: [
          {
            // delete 为标准 Del 键，backspace 兼容 Mac 笔记本删除键，否则线条/节点无法键盘删除
            keys: ["delete", "backspace"],
            callback: () => {
              const H = a.value.getSelectElements(!0);
              a.value.clearSelectElements(), H.edges.forEach((se) => a.value.deleteEdge(se.id)), H.nodes.forEach((se) => a.value.deleteNode(se.id));
            }
          }
        ]
      } : {},
      // 消费方自定义 LogicFlow 初始化选项（顶层覆盖内置默认值，如 grid / keyboard / 交互开关）
      ...t.lfOptions ?? {},
      // container 由组件内部管理，强制覆盖，避免消费方误传破坏画布挂载
      container: P
    }), a.value.setTheme({
      snapline: {
        stroke: u.value.snaplineStroke,
        strokeWidth: 2
      },
      nodeText: {
        color: u.value.nodeTextColor,
        fill: u.value.nodeTextFill,
        fontSize: 13,
        fontWeight: 500
      },
      edgeText: {
        fontSize: 13,
        strokeWidth: 1,
        background: {
          fill: u.value.edgeTextBg
        }
      },
      // 选中/悬浮的包围框：默认是黑色虚线，改成柔和蓝实线（贴近基础信息页 chroma 与 Mac 风格）
      outline: {
        stroke: "rgba(64, 158, 255, 0.7)",
        strokeWidth: 1,
        strokeDasharray: "",
        hover: {
          stroke: "rgba(64, 158, 255, 0.35)"
        }
      }
    }), z(), K(), s(), E(), window.__WF_DESIGNER_DISABLED__ = n.value, r.value && (a.value.render(r.value), y()), i.value && a.value && f(a.value, !0), k(), d(a.value));
  }
  function k() {
    const P = () => {
      a.value && a.value.resize && (a.value.resize(), requestAnimationFrame(y));
    };
    setTimeout(P, 50), setTimeout(P, 150), setTimeout(P, 300), setTimeout(P, 600), setTimeout(P, 1e3);
  }
  let F = null, m = !1, T = { w: 0, h: 0 };
  function O() {
    m || (clearTimeout(F), F = setTimeout(() => {
      var I;
      const P = o.value;
      if (!P || !((I = a.value) != null && I.resize))
        return;
      const H = P.clientWidth, se = P.clientHeight;
      Math.abs(H - T.w) < 5 && Math.abs(se - T.h) < 5 && T.w > 0 || (T = { w: H, h: se }, a.value.resize());
    }, 300));
  }
  window.addEventListener("resize", O), window._markDrawerOpen = () => {
    m = !0;
  }, window._markDrawerClosed = () => {
    setTimeout(() => {
      var P;
      m = !1, p() && ((P = a.value) != null && P.resize) && (a.value.resize(), requestAnimationFrame(() => {
        var H;
        (H = a.value) != null && H.fitView && a.value.fitView(40, 20);
      }));
    }, 350);
  };
  function N(P, H = {}, se) {
    a.value && a.value.dnd.startDrag({
      text: se,
      type: P,
      properties: H
    });
  }
  function E() {
    const P = o.value;
    if (!P)
      return;
    M(P);
    const H = P.querySelector(".lf-canvas-overlay");
    if (H)
      M(H);
    else {
      const se = new MutationObserver(() => {
        const I = P.querySelector(".lf-canvas-overlay");
        I && (M(I), se.disconnect());
      });
      se.observe(P, { childList: !0, subtree: !0 });
    }
  }
  function M(P) {
    let H = 0, se = 0, I = null;
    const Z = 350;
    let S = null, W = !1, Q = 0, ee = 0, B = !1;
    function $() {
      if (m)
        return !0;
      const G = document.querySelector(".el-drawer");
      return G ? !!(G.classList.contains("el-drawer__open") && !G.classList.contains("el-drawer__close")) : !1;
    }
    function x(G) {
      return {
        clientX: G.clientX,
        clientY: G.clientY,
        button: 0,
        bubbles: !0,
        cancelable: !0,
        view: window
      };
    }
    P.addEventListener("pointerdown", (G) => {
      if (!(G.pointerType === "mouse" && G.button !== 0)) {
        if ($() && G.pointerType === "touch") {
          G.preventDefault();
          return;
        }
        Q = G.clientX, ee = G.clientY, G.clientX, G.clientY, B = !1, W = !1, G.pointerType === "touch" && (G.preventDefault(), P.dispatchEvent(new MouseEvent("mousedown", x(G)))), S = setTimeout(() => {
          B || (W = !0, P.dispatchEvent(new MouseEvent("contextmenu", x(G))));
        }, 500);
      }
    }, { passive: !1 }), P.addEventListener("pointermove", (G) => {
      if ($() && G.pointerType === "touch") {
        G.preventDefault();
        return;
      }
      const ie = Math.abs(G.clientX - Q), Ve = Math.abs(G.clientY - ee);
      !B && (ie > 5 || Ve > 5) && (B = !0, S && (clearTimeout(S), S = null)), B && G.pointerType === "touch" ? (G.preventDefault(), P.dispatchEvent(new MouseEvent("mousemove", x(G))), G.clientX, G.clientY) : G.pointerType === "touch" && G.preventDefault();
    }, { passive: !1 });
    function q(G) {
      if ($() && G.pointerType === "touch") {
        ne(), B = !1;
        return;
      }
      if (S && (clearTimeout(S), S = null), B && G.pointerType === "touch") {
        P.dispatchEvent(new MouseEvent("mouseup", x(G))), ne(), B = !1;
        return;
      }
      if (W) {
        ne();
        return;
      }
      const ie = Date.now();
      H++, H === 1 ? (se = ie, P.dispatchEvent(new MouseEvent("click", x(G))), I = setTimeout(() => {
        H = 0, I = null;
      }, Z)) : H >= 2 && ie - se < Z ? (I && (clearTimeout(I), I = null), H = 0, P.dispatchEvent(new MouseEvent("dblclick", x(G)))) : (H = 1, se = ie, P.dispatchEvent(new MouseEvent("click", x(G))), I = setTimeout(() => {
        H = 0, I = null;
      }, Z));
    }
    P.addEventListener("pointerup", q), P.addEventListener("pointercancel", (G) => {
      B && G.pointerType === "touch" && (P.dispatchEvent(new MouseEvent("mouseup", x(G))), B = !1), S && (clearTimeout(S), S = null), ne();
    });
    function ne() {
      I && (clearTimeout(I), I = null), H = 0;
    }
  }
  function K() {
    Te(r.value.modelValue) || a.value.extension.menu.setMenuConfig({
      nodeMenu: [],
      edgeMenu: []
    });
  }
  function z() {
    var P;
    Te(r.value.modelValue) ? (a.value.register(tf), a.value.register(rf), a.value.register(af), a.value.register(cf), a.value.register(hf), a.value.register(gf), a.value.register(yf)) : (a.value.register(Pf), a.value.register(Rf), a.value.register(Mf), a.value.register(Af), a.value.register(zf), a.value.register(Hf), a.value.register(Jf)), (t.customNodes ?? []).forEach((H) => {
      H && a.value.register(H);
    }), (P = t.onRegister) == null || P.call(t, a.value);
  }
  function oe() {
    var P;
    Te(r.value.modelValue) && lt.use(_l), lt.use(kl), lt.use(xl), (t.extraExtensions ?? []).forEach((H) => {
      H && lt.use(H);
    }), (P = t.onBeforeUse) == null || P.call(t, lt);
  }
  const ge = async (P) => {
    P === !0 ? a.value.zoom(!0) : P === !1 ? a.value.zoom(!1) : P === 1 ? (a.value.zoom(1), a.value.translateCenter && a.value.translateCenter()) : P === "fit" ? a.value.fitView ? y() : (a.value.translateCenter && a.value.translateCenter(), a.value.resetZoom ? a.value.resetZoom() : a.value.zoom(1)) : typeof P == "number" && a.value.zoom(P);
  }, ce = async (P) => {
    P ? a.value.undo(P) : a.value.redo(P);
  }, ue = async () => {
    Te(r.value.modelValue) ? a.value.clearData() : (r.value = {
      ...r.value,
      ...Fo
    }, a.value.render(r.value));
  };
  function X() {
    a.value.getSnapshot(r.value.flowName, {
      fileType: "png",
      // 可选：'png'、'webp'、'jpeg'、'svg'
      backgroundColor: u.value.snapshotBg
    });
  }
  async function we() {
    try {
      if (l(), a.value) {
        let W = a.value.getGraphData();
        r.value.nodes = W.nodes, r.value.edges = W.edges;
      }
      let P = Xr(r.value);
      const H = `${r.value.flowName}_${r.value.version}.json`, se = JSON.stringify(JSON.parse(P), null, 2), I = new Blob([se], { type: "application/json" }), Z = window.URL.createObjectURL(I), S = document.createElement("a");
      S.href = Z, S.setAttribute("download", H), document.body.appendChild(S), S.click(), S.remove(), window.URL.revokeObjectURL(Z);
    } catch (P) {
      console.error("下载失败:", P);
    }
  }
  function fe() {
    return a.value ? a.value.getGraphData() : null;
  }
  return de(i, (P) => {
    a.value && f(a.value, P);
  }), Wt(() => {
    window.removeEventListener("resize", O), window.__WF_DESIGNER_DISABLED__ = !1;
  }), {
    lf: a,
    initLogicFlow: w,
    zoomViewport: ge,
    undoOrRedo: ce,
    clear: ue,
    downLoad: X,
    downJson: we,
    fitViewAll: y,
    fitViewIfMobile: b,
    handleDragInNode: N,
    getGraphData: fe
  };
}
const Kf = {
  key: 2,
  class: "logo-text"
}, Xf = {
  key: 2,
  class: "wf-state-overlay"
}, Zf = { class: "wf-state-default" }, Qf = {
  key: 3,
  class: "wf-state-overlay"
}, ep = { class: "wf-state-default" }, Ap = /* @__PURE__ */ be({
  name: "FlowDesigner",
  __name: "FlowDesigner",
  props: {
    definitionId: { default: null },
    initialJson: { default: null },
    disabled: { type: Boolean, default: !1 },
    onlyDesignShow: { type: Boolean, default: !1 },
    showGrid: { type: Boolean, default: !1 },
    customNodes: { default: () => [] },
    extraExtensions: { default: () => [] },
    lfOptions: { default: () => ({}) },
    onBeforeUse: {},
    onRegister: {},
    paletteNodes: {},
    json: {},
    structureValidator: {}
  },
  emits: ["close", "saved", "ready", "before-save", "change", "dirty", "validate-error", "node-click", "update:json"],
  setup(e, { expose: t, emit: o }) {
    const r = e, n = o, { proxy: l } = tt(), { t: s } = xe(), d = D(r.definitionId), a = D(null), i = D(r.disabled), u = D({}), f = D({}), p = D(""), b = D(!0), y = D([]), w = D([]), k = D([]), F = D([]), m = D(), T = D(!1), O = D(!1), N = D(!1), E = () => r.json !== void 0, M = D(!1), K = D(!1);
    function z() {
      K.value && (M.value || (M.value = !0, n("dirty", !0)), n("change", { dirty: !0, getJson: he, getGraphData: Q }), E() && n("update:json", he()));
    }
    function oe() {
      M.value && (M.value = !1, n("dirty", !1));
    }
    const ge = D("save");
    function ce(R) {
      n("validate-error", { source: ge.value, fields: R });
    }
    function ue(R) {
      R && n("node-click", { id: R.id, type: R.type, data: R, lf: X.value });
    }
    const {
      lf: X,
      initLogicFlow: we,
      zoomViewport: fe,
      undoOrRedo: P,
      clear: H,
      downLoad: se,
      downJson: I,
      fitViewAll: Z,
      fitViewIfMobile: S,
      handleDragInNode: W,
      getGraphData: Q
    } = Yf({
      props: r,
      containerRef: m,
      logicJson: f,
      disabled: i,
      getBaseInfo: qe,
      bindEvents: no,
      onReady: (R) => {
        Te(f.value.modelValue) && (T.value = !0), oe(), et(() => {
          K.value = !0;
        }), n("ready", { lf: R });
      }
    }), ee = D(0), B = D(r.onlyDesignShow), $ = le(() => ({
      top: "5px",
      right: "50px",
      left: Te(f.value.modelValue) ? "60px" : "50px",
      zIndex: "2",
      height: "auto",
      backgroundColor: "var(--wf-bg-white, #fff)",
      border: "1px solid var(--wf-border-light, #e2e8f0)",
      borderRadius: "6px",
      margin: "5px",
      color: "var(--wf-text-primary, #303133)",
      transition: "left 0.3s ease"
    })), x = le(() => ({
      margin: "5px",
      backgroundColor: "var(--wf-bg-white, #fff)"
    })), q = le(() => ({
      backgroundColor: "var(--wf-bg-white, #fff)",
      minHeight: "100vh",
      position: "relative"
    })), ne = le(() => [
      { title: s("flowDesigner.stepBaseInfo"), icon: "baseInfo" },
      { title: s("flowDesigner.stepFlowDesign"), icon: "flowDesign" }
      // { title: t('flowDesigner.stepFormDesign'), icon: 'formDesign' }
    ]), G = D(!1), ie = D({ x: 0, y: 0 }), Ve = D({}), $e = (R) => {
      R.icon === "between" ? Xu(X.value, R.tooltipEdge) : Zu(X.value, R.tooltipEdge, R.icon), G.value = !1, l.$nextTick(() => {
        S();
      });
    };
    async function Ke(R) {
      ee.value === 0 && !B.value && (ge.value = "step", !await l.$refs.baseInfoRef.validate()) || (ee.value = R, R === 1 && kt());
    }
    Uo(() => {
      document.body.style.overflow = "hidden", window.__WF_FLOW_DESIGN_MODE__ = !0;
      const R = r.json != null && r.json !== "" ? r.json : r.initialJson != null && r.initialJson !== "" ? r.initialJson : null;
      if (R != null) {
        const U = typeof R == "string" ? JSON.parse(R) : R;
        _t(U);
      } else
        O.value = !0, di(d.value).then((U) => _t(U.data)).catch(() => _t(null));
    });
    function _t(R) {
      // 已发布定义不再置只读：允许继续编辑，保存时由宿主决定是否另存为新版本
      if (O.value = !1, N.value = !R, p.value = R, R != null && R.categoryList && R.categoryList.length > 0 && (k.value = R.categoryList), R != null && R.formPathList && R.formPathList.length > 0 && (F.value = R.formPathList), p.value) {
        if (f.value = _d(p.value), !f.value.nodes || f.value.nodes.length === 0) {
          if (p.value.id) {
            ht().error("流程定义数据异常（节点为空），已阻止加载默认模板覆盖，请检查该流程数据");
          } else {
            let U = Te(f.value.modelValue) ? rr : Fo;
            f.value = {
              ...f.value,
              ...U
            };
          }
        }
        B.value && Ke(1);
      }
    }
    de(ee, (R) => {
      if (R === 1 && X.value) {
        const U = () => {
          var re;
          (re = X.value) != null && re.resize && (X.value.resize(), requestAnimationFrame(Z));
        };
        et(U), setTimeout(U, 150), setTimeout(U, 400), setTimeout(U, 800);
      }
    }), Wt(() => {
      window.__WF_FLOW_DESIGN_MODE__ = !1;
    });
    function qe() {
      if (B.value)
        return;
      const R = l.$refs.baseInfoRef.getFormData();
      f.value = {
        ...f.value,
        ...R
      };
    }
    function Xe(R) {
      f.value.flowName = R;
    }
    function kt() {
      const R = f.value.modelValue;
      qe();
      const U = f.value.modelValue;
      (!X.value || R !== U) && (T.value = !1, K.value = !1, et(() => {
        if ((!p.value.nodeList || p.value.nodeList.length === 0) && !p.value.id) {
          let re = Te(f.value.modelValue) ? rr : Fo;
          f.value = {
            ...f.value,
            ...re
          };
        }
        we();
      }));
    }
    async function xt() {
      const R = ht().loading({ fullscreen: !0, text: s("flowDesigner.saving") });
      if (!B.value && (ge.value = "save", !await l.$refs.baseInfoRef.validate())) {
        R.close();
        return;
      }
      let U = he(), re = !1;
      if (n("before-save", {
        id: d.value,
        json: U,
        onlyDesignShow: B.value,
        setJson: (te) => {
          typeof te == "string" && (U = te);
        },
        preventDefault: () => {
          re = !0;
        }
      }), re) {
        R.close();
        return;
      }
      if (U) {
        const wfPayload = typeof U == "string" ? JSON.parse(U) : U;
        if (wfPayload && Array.isArray(wfPayload.nodeList)) {
          const wfNodeLabel = (te) => "[" + (te.nodeName || te.nodeCode) + "]";
          const wfMissing = wfPayload.nodeList.filter((te) => String(te.nodeType) !== "2" && (!Array.isArray(te.skipList) || !te.skipList.length));
          const wfCodeSet = new Set(wfPayload.nodeList.map((te) => te.nodeCode));
          const wfDangling = [];
          wfPayload.nodeList.forEach((te) => (te.skipList || []).forEach((je) => {
            !wfCodeSet.has(je.nextNodeCode) && wfDangling.push(wfNodeLabel(te) + " → " + je.nextNodeCode);
          }));
          if (wfMissing.length || wfDangling.length) {
            R.close();
            const wfParts = [];
            const wfCcMissing = wfMissing.filter((te) => typeof te.ext == "string" && te.ext.indexOf("nodeKind") > -1 && te.ext.indexOf('"cc"') > -1);
            const wfOtherMissing = wfMissing.filter((te) => wfCcMissing.indexOf(te) < 0);
            wfCcMissing.length && wfParts.push("抄送节点" + wfCcMissing.map(wfNodeLabel).join("、") + "也必须有一条连向下一节点（或结束）的跳转线：运行时抄送通知完成后沿这条线自动流转");
            wfOtherMissing.length && wfParts.push("以下节点没有向外的跳转线，请在画布上从该节点拖出连线到下一节点：" + wfOtherMissing.map(wfNodeLabel).join("、"));
            wfDangling.length && wfParts.push("以下跳转线的目标节点不存在：" + wfDangling.join("、"));
            ht().message("error", { message: wfParts.join("；"), duration: 8e3 });
            n("validate-error", { source: "skip", fields: { missing: wfMissing.map((te) => te.nodeCode), dangling: wfDangling } });
            return;
          }
          const wfVoteNoValue = wfPayload.nodeList.filter((te) => typeof te.nodeRatio == "string" && (/^(passCount|rejectCount)=$/.test(te.nodeRatio) || te.nodeRatio === ""));
          const wfRejectNoTarget = wfPayload.nodeList.filter((te) => typeof te.nodeRatio == "string" && /^rejectCount=[1-9]\d*$/.test(te.nodeRatio) && !te.anyNodeSkip);
          if (wfVoteNoValue.length || wfRejectNoTarget.length) {
            R.close();
            const wfVoteParts = [];
            wfVoteNoValue.length && wfVoteParts.push("以下节点的票签策略值未填写，请点击节点在「规则」页签补全：" + wfVoteNoValue.map(wfNodeLabel).join("、"));
            wfRejectNoTarget.length && wfVoteParts.push("以下节点使用固定驳回人数策略，必须选择「驳回到指定节点」：" + wfRejectNoTarget.map(wfNodeLabel).join("、"));
            ht().message("error", { message: wfVoteParts.join("；"), duration: 8e3 });
            return;
          }
        }
      }
      ii(U, B.value).then((te) => {
        te.code === 200 && (l.$modal && l.$modal.msgSuccess && l.$modal.msgSuccess(s("flowDesigner.saveSuccess")), oe(), n("saved", { id: d.value, data: te.data, json: U }), setTimeout(() => {
          n("close");
        }, 500));
      }).finally(() => {
        et(() => {
          R.close();
        });
      });
    }
    function no() {
      const { eventCenter: R } = X.value.graphModel;
      R.on("history:change", z), Te(f.value.modelValue) ? (R.on("node:click", (U) => {
        a.value = U.data, ue(U.data);
        let re = X.value.getGraphData();
        y.value = re.nodes, w.value = re.edges, l.$nextTick(() => {
          u.value.show();
        });
      }), R.on("edge:click  ", (U) => {
        a.value = U.data;
        const re = X.value.getNodeModelById(a.value.sourceNodeId);
        b.value = ["serial", "inclusive"].includes(re.type);
        let te = X.value.getGraphData();
        y.value = te.nodes, w.value = te.edges, l.$nextTick(() => {
          u.value.show(["serial", "inclusive"].includes(re.type));
        });
      })) : (R.on("update:nodeName", (U) => {
        i.value || (X.value.updateText(U.id, U.nodeName), X.value.setProperties(U.id, {
          nodeName: U.nodeName
        }));
      }), R.on("node:click", (U) => {
        a.value = U.data, ue(U.data), Ue(a.value.type) && !i.value && Qu(X.value, a.value);
      }), R.on("edit:node", (U) => {
        if (U.click) {
          a.value = X.value.getNodeModelById(U.id);
          let re = X.value.getGraphData();
          y.value = re.nodes, w.value = re.edges, l.$nextTick(() => {
            u.value.show();
          });
        }
      }), R.on("show:EdgeSetting", (U) => {
        a.value = X.value.getEdgeModelById(U.id);
        const re = X.value.getNodeModelById(a.value.sourceNodeId);
        b.value = ["serial", "inclusive"].includes(re.type);
        let te = X.value.getGraphData();
        y.value = te.nodes, w.value = te.edges, l.$nextTick(() => {
          u.value.show(["serial", "inclusive"].includes(re.type));
        });
      }), R.on("show:EdgeTooltip", (U) => {
        i.value || (G.value = !0, ie.value = { x: U.e.clientX, y: U.e.clientY }, Ve.value = X.value.getEdgeModelById(U.id));
      }), R.on("hide:EdgeTooltip", () => {
        G.value = !1;
      }), R.on("delete:node", (U) => {
        if (i.value)
          return;
        const re = X.value.getNodeModelById(U.id);
        ec(X.value, re);
      })), R.on("edge:add", (U) => {
        let re = X.value.getGraphData();
        const te = Zr(re.nodes, re.edges, U.data.sourceNodeId);
        X.value.changeEdgeType(U.data.id, "skip"), X.value.setProperties(U.data.id, {
          skipType: te.some((je) => je.id === U.data.targetNodeId) ? "REJECT" : "PASS"
        });
      }), R.on("blank:click", () => {
        a.value = null, l.$nextTick(() => {
          u.value.handleClose();
        });
      });
    }
    async function J() {
      return B.value ? !0 : (ge.value = "api", await l.$refs.baseInfoRef.validate());
    }
    function he() {
      if (qe(), X.value) {
        const R = X.value.getGraphData();
        f.value.nodes = R.nodes, f.value.edges = R.edges;
      }
      return f.value.id = d.value, Xr(f.value);
    }
    function hn() {
      const R = [], U = X.value ? X.value.getGraphData() : { nodes: [], edges: [] }, re = U.nodes || [], te = U.edges || [];
      if (re.filter((Me) => Me.type === "start").length < 1 && R.push(s("flowDesigner.errNoStart")), re.filter((Me) => Me.type === "end").length < 1 && R.push(s("flowDesigner.errNoEnd")), re.length > 1) {
        const Me = /* @__PURE__ */ new Set();
        te.forEach((Rt) => {
          Me.add(Rt.sourceNodeId), Me.add(Rt.targetNodeId);
        });
        const mn = re.filter((Rt) => !Me.has(Rt.id));
        mn.length > 0 && R.push(s("flowDesigner.errIsolated", { n: mn.length }));
      }
      const je = r.structureValidator ? r.structureValidator({ nodes: re, edges: te }) : void 0;
      return Array.isArray(je) && je.forEach((Me) => {
        Me && R.push(String(Me));
      }), { valid: R.length === 0, errors: R };
    }
    return t({
      save: xt,
      validate: J,
      getGraphData: Q,
      getFlowJson: he,
      getFlowName: () => f.value.flowName ?? "",
      getLogicFlow: () => X.value,
      zoom: fe,
      zoomIn: () => fe(!0),
      zoomOut: () => fe(!1),
      fitView: () => fe("fit"),
      resetZoom: () => fe(1),
      undo: () => P(!0),
      redo: () => P(!1),
      clear: H,
      downloadImage: se,
      downloadJson: I,
      isDirty: () => M.value,
      resetDirty: oe,
      validateStructure: hn
    }), (R, U) => {
      const re = L("wf-header");
      return _(), V("div", {
        style: He(q.value)
      }, [
        B.value ? j("", !0) : (_(), Y(Hc, {
          key: 0,
          "flow-name": f.value.flowName,
          "active-step": ee.value,
          steps: ne.value,
          disabled: i.value,
          onStepClick: Ke,
          onSave: xt
        }, Dt({ _: 2 }, [
          R.$slots["header-left"] ? {
            name: "header-left",
            fn: g((te) => [
              me(R.$slots, "header-left", ut(ct(te)))
            ]),
            key: "0"
          } : void 0,
          R.$slots["header-center"] ? {
            name: "header-center",
            fn: g((te) => [
              me(R.$slots, "header-center", ut(ct(te)))
            ]),
            key: "1"
          } : void 0,
          R.$slots["header-actions"] ? {
            name: "header-actions",
            fn: g((te) => [
              me(R.$slots, "header-actions", ut(ct(te)))
            ]),
            key: "2"
          } : void 0
        ]), 1032, ["flow-name", "active-step", "steps", "disabled"])),
        h(re, {
          style: He($.value)
        }, {
          default: g(() => [
            h(Zc, {
              "active-step": ee.value,
              "only-design-show": B.value,
              disabled: i.value,
              lf: c(X),
              onZoomOut: U[0] || (U[0] = (te) => c(fe)(!1)),
              onFitView: U[1] || (U[1] = (te) => c(fe)("fit")),
              onZoomIn: U[2] || (U[2] = (te) => c(fe)(!0)),
              onUndo: U[3] || (U[3] = (te) => c(P)(!0)),
              onRedo: U[4] || (U[4] = (te) => c(P)(!1)),
              onClear: U[5] || (U[5] = (te) => c(H)()),
              onDownloadImage: c(se),
              onDownloadJson: c(I),
              onSave: xt
            }, Dt({ _: 2 }, [
              R.$slots["toolbar-extra"] ? {
                name: "toolbar-extra",
                fn: g((te) => [
                  me(R.$slots, "toolbar-extra", ut(ct(te)))
                ]),
                key: "0"
              } : void 0
            ]), 1032, ["active-step", "only-design-show", "disabled", "lf", "onDownloadImage", "onDownloadJson"]),
            B.value ? j("", !0) : ke((_(), Y(Wu, {
              key: 0,
              style: He(x.value),
              ref: "baseInfoRef",
              "logic-json": f.value,
              "category-list": k.value,
              "form-path-list": F.value,
              "definition-id": d.value,
              disabled: i.value,
              "onUpdate:flowName": Xe,
              "onUpdate:modelValue": kt,
              onValidateError: ce
            }, null, 8, ["style", "logic-json", "category-list", "form-path-list", "definition-id", "disabled"])), [
              [Ne, ee.value === 0]
            ]),
            T.value && ee.value === 1 ? me(R.$slots, "sidebar", {
              key: 1,
              dragInNode: c(W),
              lf: c(X),
              disabled: i.value
            }, () => {
              var te, je;
              return [
                h(Vc, {
                  class: "diagram-sidebar",
                  "flow-nodes": (te = R.paletteNodes) == null ? void 0 : te.flowNodes,
                  "gateway-nodes": (je = R.paletteNodes) == null ? void 0 : je.gatewayNodes,
                  onDragInNode: c(W)
                }, null, 8, ["flow-nodes", "gateway-nodes", "onDragInNode"])
              ];
            }) : j("", !0),
            ke(v("div", {
              class: "container",
              ref_key: "containerRef",
              ref: m
            }, [
              h(Nu, {
                ref_key: "propertySettingRef",
                ref: u,
                node: a.value,
                lf: c(X),
                disabled: i.value,
                skipConditionShow: b.value,
                nodes: y.value,
                skips: w.value,
                "form-path-list": F.value
              }, Dt({ _: 2 }, [
                ye(R.$slots, (te, je) => ({
                  name: je,
                  fn: g((Me) => [
                    me(R.$slots, je, ut(ct(Me || {})))
                  ])
                }))
              ]), 1032, ["node", "lf", "disabled", "skipConditionShow", "nodes", "skips", "form-path-list"])
            ], 512), [
              [Ne, ee.value === 1]
            ]),
            ee.value === 1 ? (_(), V("div", Kf, [
              me(R.$slots, "logo", {}, () => [
                Se("Warm-Flow")
              ])
            ])) : j("", !0)
          ]),
          _: 3
        }, 8, ["style"]),
        G.value ? (_(), Y(fc, {
          key: 1,
          position: ie.value,
          tooltipEdge: Ve.value,
          onOptionClick: $e,
          onCloseTooltip: U[6] || (U[6] = (te) => G.value = !1)
        }, null, 8, ["position", "tooltipEdge"])) : j("", !0),
        O.value ? (_(), V("div", Xf, [
          me(R.$slots, "loading", {}, () => [
            v("div", Zf, A(c(s)("common.loading")), 1)
          ])
        ])) : N.value ? (_(), V("div", Qf, [
          me(R.$slots, "empty", {}, () => [
            v("div", ep, A(c(s)("flowDesigner.emptyDef")), 1)
          ])
        ])) : j("", !0)
      ], 4);
    };
  }
}), tp = be({
  components: { Icon: _s },
  props: {
    iconClass: {
      type: String,
      required: !0
    },
    className: {
      type: String,
      default: ""
    },
    color: {
      type: String,
      default: ""
    }
  },
  setup(e) {
    return {
      iconName: le(() => e.iconClass.includes(":") ? e.iconClass : `wf:${e.iconClass}`),
      svgClass: le(() => e.className ? `svg-icon ${e.className}` : "svg-icon")
    };
  }
});
function op(e, t, o, r, n, l) {
  const s = L("Icon");
  return _(), Y(s, {
    icon: e.iconName,
    class: _e(e.svgClass),
    style: He(e.color ? { color: e.color } : void 0),
    "aria-hidden": "true"
  }, null, 8, ["icon", "class", "style"]);
}
const np = /* @__PURE__ */ Ee(tp, [["render", op]]);
function Ae(e, t) {
  return Promise.resolve({ code: 200, msg: t || "ok(mock)", data: e });
}
const It = {
  角色: [
    { storageId: "role:1", handlerCode: "admin", handlerName: "系统管理员", groupName: "角色", createTime: "2024-01-01 10:00:00" },
    { storageId: "role:2", handlerCode: "leader", handlerName: "部门主管", groupName: "角色", createTime: "2024-01-02 10:00:00" },
    { storageId: "role:3", handlerCode: "finance", handlerName: "财务专员", groupName: "角色", createTime: "2024-01-03 10:00:00" },
    { storageId: "role:4", handlerCode: "hr", handlerName: "人事专员", groupName: "角色", createTime: "2024-01-04 10:00:00" }
  ],
  部门: [
    { storageId: "dept:1", handlerCode: "tech", handlerName: "研发部", groupName: "部门", createTime: "2024-01-01 10:00:00" },
    { storageId: "dept:2", handlerCode: "hr", handlerName: "人事部", groupName: "部门", createTime: "2024-01-02 10:00:00" },
    { storageId: "dept:3", handlerCode: "finance", handlerName: "财务部", groupName: "部门", createTime: "2024-01-03 10:00:00" },
    { storageId: "dept:4", handlerCode: "market", handlerName: "市场部", groupName: "部门", createTime: "2024-01-04 10:00:00" }
  ],
  用户: [
    { storageId: "user:1", handlerCode: "zhangsan", handlerName: "张三", groupName: "用户", createTime: "2024-01-01 10:00:00" },
    { storageId: "user:2", handlerCode: "lisi", handlerName: "李四", groupName: "用户", createTime: "2024-01-02 10:00:00" },
    { storageId: "user:3", handlerCode: "wangwu", handlerName: "王五", groupName: "用户", createTime: "2024-01-03 10:00:00" },
    { storageId: "user:4", handlerCode: "zhaoliu", handlerName: "赵六", groupName: "用户", createTime: "2024-01-04 10:00:00" },
    { storageId: "user:5", handlerCode: "qianqi", handlerName: "钱七", groupName: "用户", createTime: "2024-01-05 10:00:00" },
    { storageId: "user:6", handlerCode: "sunba", handlerName: "孙八", groupName: "用户", createTime: "2024-01-06 10:00:00" }
  ]
}, rp = [
  {
    id: "1",
    name: "总公司",
    parentId: "0",
    children: [
      {
        id: "2",
        name: "研发中心",
        parentId: "1",
        children: [
          { id: "21", name: "前端组", parentId: "2", children: [] },
          { id: "22", name: "后端组", parentId: "2", children: [] }
        ]
      },
      {
        id: "3",
        name: "职能中心",
        parentId: "1",
        children: [
          { id: "31", name: "人事部", parentId: "3", children: [] },
          { id: "32", name: "财务部", parentId: "3", children: [] }
        ]
      }
    ]
  }
], lp = [
  {
    id: "oa",
    name: "OA办公",
    children: [
      { id: "oa-leave", name: "请假流程", children: [] },
      { id: "oa-reimburse", name: "报销流程", children: [] }
    ]
  },
  {
    id: "hr",
    name: "人事流程",
    children: [
      { id: "hr-entry", name: "入职流程", children: [] },
      { id: "hr-quit", name: "离职流程", children: [] }
    ]
  },
  { id: "finance", name: "财务流程", children: [] }
], sp = [
  { id: "form-leave", name: "请假申请表", children: [] },
  { id: "form-reimburse", name: "报销申请表", children: [] },
  { id: "form-purchase", name: "采购审批表", children: [] }
], ap = [
  {
    type: 1,
    name: "扩展属性",
    code: "baseExt",
    childs: [
      { label: "业务单号", code: "bizNo", type: 1, must: !1, desc: "请输入业务单号" },
      { label: "备注说明", code: "remark", type: 2, must: !1, desc: "请输入备注（多行）" },
      {
        label: "优先级",
        code: "priority",
        type: 3,
        must: !1,
        desc: "请选择优先级",
        dict: [
          { label: "低", value: "1" },
          { label: "中", value: "2", selected: !0 },
          { label: "高", value: "3" }
        ]
      },
      {
        label: "关注标签",
        code: "tags",
        type: 3,
        multiple: !0,
        must: !1,
        desc: "可多选",
        dict: [
          { label: "紧急", value: "urgent" },
          { label: "重要", value: "important" },
          { label: "常规", value: "normal" }
        ]
      },
      {
        label: "是否抄送",
        code: "cc",
        type: 4,
        must: !1,
        desc: "请选择",
        dict: [
          { label: "是", value: "1", selected: !0 },
          { label: "否", value: "0" }
        ]
      },
      {
        label: "通知方式",
        code: "notify",
        type: 4,
        multiple: !0,
        must: !1,
        desc: "可多选",
        dict: [
          { label: "站内信", value: "site" },
          { label: "邮件", value: "email" },
          { label: "短信", value: "sms" }
        ]
      },
      { label: "抄送人", code: "ccUsers", type: 5, must: !1, desc: "选择抄送人" },
      { label: "限时(小时)", code: "limitHours", type: 6, must: !1, desc: "审批限时", precision: 0, step: 1, min: 0 },
      { label: "截止时间", code: "deadline", type: 7, must: !1, desc: "请选择截止时间", dateType: "datetime", dateFormat: "YYYY-MM-DD HH:mm:ss" }
    ]
  },
  {
    type: 2,
    name: "高级设置",
    code: "advanced",
    childs: [
      {
        label: "允许加签",
        code: "allowAddSign",
        type: 4,
        must: !1,
        desc: "是否允许加签",
        dict: [
          { label: "允许", value: "1", selected: !0 },
          { label: "禁止", value: "0" }
        ]
      },
      {
        label: "允许转办",
        code: "allowTransfer",
        type: 4,
        must: !1,
        desc: "是否允许转办",
        dict: [
          { label: "允许", value: "1", selected: !0 },
          { label: "禁止", value: "0" }
        ]
      },
      { label: "审批意见模板", code: "commentTpl", type: 2, must: !1, desc: "默认审批意见" }
    ]
  }
], ip = [].concat(It.角色, It.部门, It.用户);
function dp() {
  return {
    // ===== 流程定义 =====
    saveJson() {
      return Ae(!0, "保存成功(mock)");
    },
    // 新建态：返回流程类别 / 表单标识等元数据（设计器据此填充「流程类别 / 表单唯一标识」下拉），
    // 无 nodeList 时设计器仍走本地 initData 渲染初始节点。
    queryDef() {
      return Ae({ categoryList: lp, formPathList: sp });
    },
    queryFlowChart() {
      return Ae({});
    },
    // 办理人权限 tab（角色 / 部门 / 用户）
    handlerType() {
      return Ae(["角色", "部门", "用户"]);
    },
    // 办理人列表 + 左侧组织树（对齐 HandlerSelectVo: { handlerAuths: FlowPage, treeSelections: Tree[] }）
    handlerResult(e) {
      const t = e && e.handlerType || "角色", o = It[t] || It.角色;
      return Ae({
        handlerAuths: { rows: o, total: o.length },
        treeSelections: rp
      });
    },
    // 办理人名称回显（对齐 HandlerFeedBackVo: [{ storageId, handlerName }]）
    handlerFeedback(e) {
      const t = e && e.storageIds ? String(e.storageIds) : "", r = (t ? t.split(",") : []).map((n) => {
        const l = ip.find((s) => s.storageId === n);
        return { storageId: n, handlerName: l ? l.handlerName : n };
      });
      return Ae(r);
    },
    // 办理人字典（对齐 Dict: [{ label, value, childList }]）
    handlerDict() {
      return Ae([
        { label: "角色", value: "role", childList: [] },
        { label: "部门", value: "dept", childList: [] },
        { label: "用户", value: "user", childList: [] }
      ]);
    },
    // 已发布表单定义列表（自定义表单下拉）
    publishedList() {
      return Ae([
        { id: "1001", formName: "请假申请表(mock)" },
        { id: "1002", formName: "报销申请表(mock)" }
      ]);
    },
    // 节点扩展属性（覆盖全部控件类型 1-7，使 between 节点「扩展属性 / 高级设置」面板有可演示数据）
    nodeExt() {
      return Ae(ap);
    },
    // 监听器下拉（对齐 ListenerVo: [{ type, path, description }]）
    listenerList() {
      return Ae([
        { type: "start", path: "com.example.flow.StartListener", description: "开始监听器(mock)" },
        { type: "assignment", path: "com.example.flow.AssignmentListener", description: "指派监听器(mock)" },
        { type: "finish", path: "com.example.flow.FinishListener", description: "完成监听器(mock)" }
      ]);
    },
    // ===== 配置 =====
    // 设计器启动即调用，返回安全默认（无 token、默认框架 springboot），保证 mock 下可正常初始化
    config() {
      return Ae({ tokenNameList: [], framework: "springboot" });
    }
  };
}
var up = {};
function cp() {
  let e = !1;
  try {
    e = new URLSearchParams(window.location.search).get("mock") === "true";
  } catch {
    e = !1;
  }
  return up.VITE_USE_MOCK === "true" || e;
}
function Bp() {
  cp() && ai(dp());
}
const pn = D("default");
function fp(e) {
  pn.value = e;
}
function Up() {
  return pn.value;
}
function pp() {
  return pn;
}
function hp(e, t) {
  return be({
    name: e,
    inheritAttrs: !1,
    setup(o, { attrs: r, slots: n, expose: l }) {
      const s = D(null), d = pp();
      return l(
        new Proxy(
          {},
          {
            get(a, i) {
              const u = s.value;
              if (!u)
                return;
              const f = u[i];
              return typeof f == "function" ? f.bind(u) : f;
            },
            has(a, i) {
              const u = s.value;
              return u ? i in u : !1;
            }
          }
        )
      ), () => {
        var f;
        const a = (f = ht().components) == null ? void 0 : f[t];
        if (!a)
          return null;
        const i = d.value, u = i !== "default" && r.size == null ? { size: i, ...r, ref: s } : { ...r, ref: s };
        return Ut(a, u, n);
      };
    }
  });
}
const mp = [
  "button",
  "input",
  "input-number",
  "select",
  "option",
  "form",
  "form-item",
  "table",
  "table-column",
  "col",
  "row",
  "header",
  "checkbox",
  "checkbox-group",
  "tree-select",
  "tree",
  "tag",
  "radio",
  "radio-group",
  "dialog",
  "drawer",
  "date-picker",
  "time-picker",
  "switch",
  "pagination",
  "divider",
  "tooltip",
  "icon"
];
function vp(e) {
  return e.split("-").map((t) => t.charAt(0).toUpperCase() + t.slice(1)).join("");
}
const sr = mp.reduce((e, t) => (e[`wf-${t}`] = hp(`Wf${vp(t)}`, t), e), {});
function gp(e) {
  Object.keys(sr).forEach((t) => {
    e.component(t) || e.component(t, sr[t]);
  });
}
function zp() {
  const e = D(null);
  function t(o) {
    return e.value ? e.value : (console.warn(
      `[warm-flow] useFlowDesigner.${o}(): 设计器尚未挂载，调用被忽略。请确认已将 designerRef 绑定到 <FlowDesigner ref="designerRef" /> 且组件已渲染。`
    ), null);
  }
  return {
    designerRef: e,
    isReady: () => !!e.value,
    save: async () => {
      var o;
      await ((o = t("save")) == null ? void 0 : o.save());
    },
    validate: async () => {
      var o;
      return await ((o = t("validate")) == null ? void 0 : o.validate()) ?? !1;
    },
    getGraphData: () => {
      var o;
      return ((o = t("getGraphData")) == null ? void 0 : o.getGraphData()) ?? null;
    },
    getFlowJson: () => {
      var o;
      return ((o = t("getFlowJson")) == null ? void 0 : o.getFlowJson()) ?? "";
    },
    getFlowName: () => {
      var o;
      return ((o = t("getFlowName")) == null ? void 0 : o.getFlowName()) ?? "";
    },
    getLogicFlow: () => {
      var o;
      return ((o = t("getLogicFlow")) == null ? void 0 : o.getLogicFlow()) ?? null;
    },
    zoom: (o) => {
      var r;
      (r = t("zoom")) == null || r.zoom(o);
    },
    zoomIn: () => {
      var o;
      (o = t("zoomIn")) == null || o.zoomIn();
    },
    zoomOut: () => {
      var o;
      (o = t("zoomOut")) == null || o.zoomOut();
    },
    fitView: () => {
      var o;
      (o = t("fitView")) == null || o.fitView();
    },
    resetZoom: () => {
      var o;
      (o = t("resetZoom")) == null || o.resetZoom();
    },
    undo: () => {
      var o;
      (o = t("undo")) == null || o.undo();
    },
    redo: () => {
      var o;
      (o = t("redo")) == null || o.redo();
    },
    clear: () => {
      var o;
      (o = t("clear")) == null || o.clear();
    },
    downloadImage: () => {
      var o;
      (o = t("downloadImage")) == null || o.downloadImage();
    },
    downloadJson: () => {
      var o;
      (o = t("downloadJson")) == null || o.downloadJson();
    },
    isDirty: () => {
      var o;
      return ((o = t("isDirty")) == null ? void 0 : o.isDirty()) ?? !1;
    },
    resetDirty: () => {
      var o;
      (o = t("resetDirty")) == null || o.resetDirty();
    },
    validateStructure: () => {
      var o;
      return ((o = t("validateStructure")) == null ? void 0 : o.validateStructure()) ?? { valid: !1, errors: ["设计器尚未挂载"] };
    }
  };
}
function qp(e) {
  const t = D(""), o = D(!1), r = le(() => {
    try {
      return t.value ? JSON.parse(t.value) : null;
    } catch {
      return null;
    }
  });
  function n() {
    const s = e.value;
    return t.value = s ? s.getFlowJson() : "", s && (o.value = s.isDirty()), t.value;
  }
  return { json: t, data: r, dirty: o, sync: n, bind: {
    // 画布就绪 / 变更 / 保存成功后刷新 json（与 dirty）
    onReady: () => {
      n();
    },
    onChange: () => {
      n();
    },
    onSaved: () => {
      n();
    },
    // 未保存状态翻转：同步 dirty；变干净时顺带刷新 json（反映已保存内容）
    onDirty: (s) => {
      o.value = !!s, s || n();
    }
  } };
}
const wp = (e, t = {}) => {
  if (t.size && fp(t.size), e.component("svg-icon", np), gp(e), Cs() && !e.directive("loading")) {
    const o = ht().loadingDirective;
    o && e.directive("loading", o);
  }
}, jp = { install: wp };
export {
  Wu as BaseInfo,
  Vc as DiagramSidebar,
  Ap as FlowDesigner,
  Nu as PropertySetting,
  np as SvgIcon,
  jp as WarmFlowDesigner,
  jr as createHttpProvider,
  dp as createMockProvider,
  jp as default,
  Up as getComponentSize,
  Ye as getDataProvider,
  Es as getLocale,
  ht as getUiAdapter,
  wp as install,
  cp as isMockEnabled,
  fp as setComponentSize,
  ai as setDataProvider,
  Is as setLocale,
  Sp as setMessages,
  Cp as setUiAdapter,
  Bp as setupDataProvider,
  Ts as translate,
  nl as useDark,
  zp as useFlowDesigner,
  qp as useFlowJson,
  xe as useI18n
};

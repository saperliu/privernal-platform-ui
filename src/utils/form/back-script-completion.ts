import * as monaco from 'monaco-editor';
import type { languages } from 'monaco-editor';

/**
 * 后端代码（Groovy 脚本）Monaco 语法提示。
 *
 * 运行环境是 GroovyShell（GroovyScriptService），绑定变量只有 daoService / requestData；
 * 沙箱白名单允许 java.lang/util/time/math/text、cn.hutool.json、cn.hutool.core、
 * com.alibaba.fastjson2 的 star import。提示内容与之严格对齐，只提示跑得通的写法。
 */

export interface BackScriptField {
  /** 字段标题（中文） */
  label: string;
  /** 字段编码（表单字段名） */
  value: string;
}

/** 当前表单的字段列表（form-designer 挂载后注入，随画布实时更新） */
let currentFields: BackScriptField[] = [];

export function setBackScriptFields(fields: BackScriptField[]) {
  currentFields = Array.isArray(fields) ? fields : [];
}

const KIND = monaco.languages.CompletionItemKind;

interface MethodHint {
  name: string;
  /** 补全时插入的文本（含括号与参数占位） */
  insert: string;
  /** 参数签名说明 */
  signature: string;
  doc: string;
}

/** daoService 内置数据方法（与后端 DaoService 接口一一对应） */
const DAO_SERVICE_METHODS: MethodHint[] = [
  {
    name: 'saveOrUpdate',
    insert: 'saveOrUpdate(${1:tableName}, ${2:[field: value]})',
    signature: 'saveOrUpdate(tableName, data)',
    doc: '保存或更新表数据，返回数据 ID。\n示例：def id = daoService.saveOrUpdate("course_info", [name: requestData.name])'
  },
  {
    name: 'findById',
    insert: 'findById(${1:tableName}, ${2:id})',
    signature: 'findById(tableName, id)',
    doc: '按 ID 查询单条数据，返回 Map（无则 null）。\n示例：def row = daoService.findById("course_info", "1")'
  },
  {
    name: 'findByPage',
    insert: 'findByPage(${1:tableName}, ${2:[pageNum: 1, pageSize: 10]})',
    signature: 'findByPage(tableName, query)',
    doc: '按键值条件分页查询，query 支持 pageNum/pageSize/字段条件。\n返回 PageResultInfo：.list 数据、.total 总数'
  },
  {
    name: 'querySql',
    insert: 'querySql(${1:tableName}, ${2:"select * from ... "})',
    signature: 'querySql(tableName, sql)',
    doc: '按 SQL 直接查询（只读），返回 List<Map>。\n示例：def rows = daoService.querySql("course_info", "select * from course_info")'
  },
  {
    name: 'deleteById',
    insert: 'deleteById(${1:tableName}, ${2:id})',
    signature: 'deleteById(tableName, id)',
    doc: '按 ID 删除单条数据'
  },
  {
    name: 'deleteByIds',
    insert: 'deleteByIds(${1:tableName}, ${2:["id1", "id2"]})',
    signature: 'deleteByIds(tableName, ids)',
    doc: '按 ID 集合批量删除数据'
  }
];

/** requestData（Map）常用方法 */
const REQUEST_DATA_METHODS: MethodHint[] = [
  { name: 'get', insert: 'get(${1:"fieldCode"})', signature: 'get(key)', doc: '按字段编码取值，无则 null' },
  {
    name: 'containsKey',
    insert: 'containsKey(${1:"fieldCode"})',
    signature: 'containsKey(key)',
    doc: '是否包含该字段'
  },
  { name: 'keySet', insert: 'keySet()', signature: 'keySet()', doc: '全部字段编码集合' },
  { name: 'size', insert: 'size()', signature: 'size()', doc: '字段个数' }
];

/** 白名单工具库：类名级提示（触发 . 后给常用静态成员） */
const UTIL_CLASSES: Record<string, { detail: string; doc: string; methods?: MethodHint[] }> = {
  StrUtil: {
    detail: 'cn.hutool.core.util.StrUtil',
    doc: '字符串工具',
    methods: [
      { name: 'isBlank', insert: 'isBlank(${1:str})', signature: 'isBlank(str)', doc: '是否空白串' },
      { name: 'isNotBlank', insert: 'isNotBlank(${1:str})', signature: 'isNotBlank(str)', doc: '是否非空白串' },
      { name: 'isEmpty', insert: 'isEmpty(${1:str})', signature: 'isEmpty(str)', doc: '是否空串' },
      {
        name: 'format',
        insert: 'format(${1:"{}"}, ${2:arg})',
        signature: 'format(template, args...)',
        doc: '{} 占位格式化'
      }
    ]
  },
  DateUtil: {
    detail: 'cn.hutool.core.date.DateUtil',
    doc: '日期时间工具',
    methods: [
      { name: 'now', insert: 'now()', signature: 'now()', doc: '当前时间字符串 yyyy-MM-dd HH:mm:ss' },
      { name: 'today', insert: 'today()', signature: 'today()', doc: '当前日期字符串 yyyy-MM-dd' },
      {
        name: 'format',
        insert: 'format(${1:date}, ${2:"yyyy-MM-dd"})',
        signature: 'format(date, format)',
        doc: '格式化日期'
      },
      { name: 'parse', insert: 'parse(${1:str})', signature: 'parse(str)', doc: '解析日期字符串' },
      { name: 'beginOfDay', insert: 'beginOfDay(${1:date})', signature: 'beginOfDay(date)', doc: '当天开始时刻' },
      { name: 'endOfDay', insert: 'endOfDay(${1:date})', signature: 'endOfDay(date)', doc: '当天结束时刻' }
    ]
  },
  CollUtil: {
    detail: 'cn.hutool.core.collection.CollUtil',
    doc: '集合工具',
    methods: [
      { name: 'isEmpty', insert: 'isEmpty(${1:coll})', signature: 'isEmpty(coll)', doc: '集合是否为空' },
      { name: 'isNotEmpty', insert: 'isNotEmpty(${1:coll})', signature: 'isNotEmpty(coll)', doc: '集合是否非空' },
      { name: 'join', insert: 'join(${1:coll}, ${2:","})', signature: 'join(coll, separator)', doc: '集合拼接为字符串' }
    ]
  },
  NumberUtil: {
    detail: 'cn.hutool.core.util.NumberUtil',
    doc: '数字工具',
    methods: [
      {
        name: 'round',
        insert: 'round(${1:number}, ${2:scale})',
        signature: 'round(number, scale)',
        doc: '四舍五入保留小数位'
      },
      { name: 'isNumber', insert: 'isNumber(${1:str})', signature: 'isNumber(str)', doc: '是否数字' }
    ]
  },
  ObjectUtil: {
    detail: 'cn.hutool.core.util.ObjectUtil',
    doc: '对象工具',
    methods: [
      { name: 'isNull', insert: 'isNull(${1:obj})', signature: 'isNull(obj)', doc: '对象是否为 null' },
      {
        name: 'defaultIfNull',
        insert: 'defaultIfNull(${1:obj}, ${2:defaultValue})',
        signature: 'defaultIfNull(obj, def)',
        doc: '为 null 时取默认值'
      }
    ]
  },
  JSONUtil: {
    detail: 'cn.hutool.json.JSONUtil',
    doc: 'JSON 工具（hutool）',
    methods: [
      { name: 'toJsonStr', insert: 'toJsonStr(${1:obj})', signature: 'toJsonStr(obj)', doc: '对象转 JSON 字符串' },
      { name: 'parseObj', insert: 'parseObj(${1:jsonStr})', signature: 'parseObj(jsonStr)', doc: '解析 JSON 对象' },
      {
        name: 'parseArray',
        insert: 'parseArray(${1:jsonStr})',
        signature: 'parseArray(jsonStr)',
        doc: '解析 JSON 数组'
      }
    ]
  },
  JSON: {
    detail: 'com.alibaba.fastjson2.JSON',
    doc: 'JSON 工具（fastjson2）',
    methods: [
      {
        name: 'toJSONString',
        insert: 'toJSONString(${1:obj})',
        signature: 'toJSONString(obj)',
        doc: '对象转 JSON 字符串'
      },
      {
        name: 'parseObject',
        insert: 'parseObject(${1:jsonStr})',
        signature: 'parseObject(jsonStr)',
        doc: '解析 JSON 对象'
      },
      {
        name: 'parseArray',
        insert: 'parseArray(${1:jsonStr})',
        signature: 'parseArray(jsonStr)',
        doc: '解析 JSON 数组'
      }
    ]
  },
  LocalDateTime: {
    detail: 'java.time.LocalDateTime',
    doc: '本地日期时间',
    methods: [{ name: 'now', insert: 'now()', signature: 'now()', doc: '当前时间' }]
  },
  LocalDate: {
    detail: 'java.time.LocalDate',
    doc: '本地日期',
    methods: [{ name: 'now', insert: 'now()', signature: 'now()', doc: '当前日期' }]
  },
  BigDecimal: {
    detail: 'java.math.BigDecimal',
    doc: '精确小数',
    methods: []
  },
  DateTimeFormatter: {
    detail: 'java.time.format.DateTimeFormatter',
    doc: '日期格式化器',
    methods: [
      {
        name: 'ofPattern',
        insert: 'ofPattern(${1:"yyyy-MM-dd"})',
        signature: 'ofPattern(pattern)',
        doc: '按模式创建格式化器'
      }
    ]
  }
};

/** 代码片段（插入即整段模板） */
const SNIPPETS: Array<{ label: string; insert: string; doc: string }> = [
  {
    label: 'if 判空分支',
    insert: 'if (${1:requestData.fieldCode}) {\n\t${2:// TODO}\n}',
    doc: 'Groovy 真值判断：null/空串/0 均为假'
  },
  {
    label: 'for 遍历列表',
    insert: 'for (item in ${1:list}) {\n\t${2:// TODO}\n}',
    doc: 'Groovy for-in 遍历'
  },
  {
    label: '保存数据示例',
    insert: 'def id = daoService.saveOrUpdate("${1:tableCode}", [\n\tfield_code: requestData.field_code\n])',
    doc: 'saveOrUpdate 写入当前提交的数据'
  },
  {
    label: '查询数据示例',
    insert: 'def row = daoService.findById("${1:tableCode}", ${2:id})\nif (row != null) {\n\t${3:// TODO}\n}',
    doc: '按 ID 查询并判空'
  },
  {
    label: '返回结果示例',
    insert: 'return [success: true, message: "${1:处理成功}"]',
    doc: '脚本返回值（Map 会写入执行结果）'
  }
];

/** 补全范围（结构化兼容 monaco 的 IRange，0.56 的 languages 命名空间未导出该类型） */
interface SimpleRange {
  startLineNumber: number;
  endLineNumber: number;
  startColumn: number;
  endColumn: number;
}

function toCompletion(
  item: MethodHint,
  kind: languages.CompletionItemKind,
  range: SimpleRange,
  detailPrefix: string,
  sortBase: string
): languages.CompletionItem {
  return {
    label: item.name,
    kind,
    detail: detailPrefix ? `${detailPrefix} ${item.signature}` : item.signature,
    documentation: item.doc,
    insertText: item.insert,
    insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
    range,
    sortText: `${sortBase}_${item.name}`
  };
}

let registered = false;

/** 注册 java 语言的脚本补全（幂等；monaco 为模块级单例，全站 java 编辑器共用） */
export function registerBackScriptCompletion() {
  if (registered) return;
  registered = true;

  monaco.languages.registerCompletionItemProvider('java', {
    triggerCharacters: ['.', '"'],
    provideCompletionItems(model, position) {
      const linePrefix = model.getLineContent(position.lineNumber).slice(0, position.column - 1);
      const word = model.getWordUntilPosition(position);
      const range: SimpleRange = {
        startLineNumber: position.lineNumber,
        endLineNumber: position.lineNumber,
        startColumn: word.startColumn,
        endColumn: word.endColumn
      };
      const suggestions: languages.CompletionItem[] = [];

      // 成员补全：daoService. / requestData. / 工具类.
      const memberMatch = linePrefix.match(/([A-Za-z_][A-Za-z0-9_]*)\.\w*$/);
      if (memberMatch) {
        const owner = memberMatch[1];
        if (owner === 'daoService') {
          DAO_SERVICE_METHODS.forEach(m => suggestions.push(toCompletion(m, KIND.Method, range, 'daoService', 'a')));
          return { suggestions };
        }
        if (owner === 'requestData') {
          // 事件数据字段（动态表单当前字段）
          currentFields.forEach(field => {
            suggestions.push({
              label: field.value,
              kind: KIND.Field,
              detail: `表单字段 ${field.label}`,
              insertText: field.value,
              range,
              sortText: `a_field_${field.value}`
            });
          });
          REQUEST_DATA_METHODS.forEach(m => suggestions.push(toCompletion(m, KIND.Method, range, 'Map', 'b')));
          return { suggestions };
        }
        const util = UTIL_CLASSES[owner];
        if (util?.methods?.length) {
          util.methods.forEach(m => suggestions.push(toCompletion(m, KIND.Method, range, util.detail, 'a')));
          return { suggestions };
        }
        return { suggestions: [] };
      }

      // 顶层补全：绑定变量、当前表单字段（requestData.xxx 形式）、工具类、片段
      suggestions.push({
        label: 'daoService',
        kind: KIND.Variable,
        detail: '内置数据服务',
        documentation: '数据操作入口：saveOrUpdate / findById / findByPage / querySql / deleteById / deleteByIds',
        insertText: 'daoService',
        range,
        sortText: 'a_daoService'
      });
      suggestions.push({
        label: 'requestData',
        kind: KIND.Variable,
        detail: '本次提交的表单数据（Map）',
        documentation: '事件/提交数据：requestData.字段编码 取值；含 tableCode / id / 全部字段值',
        insertText: 'requestData',
        range,
        sortText: 'a_requestData'
      });
      currentFields.forEach(field => {
        suggestions.push({
          label: `requestData.${field.value}`,
          kind: KIND.Field,
          detail: `表单字段 ${field.label}`,
          documentation: `取本次提交的「${field.label}」值（字段编码 ${field.value}）`,
          insertText: `requestData.${field.value}`,
          filterText: `${field.label}${field.value}`,
          range,
          sortText: `a_field_${field.value}`
        });
      });
      Object.entries(UTIL_CLASSES).forEach(([name, util]) => {
        suggestions.push({
          label: name,
          kind: KIND.Class,
          detail: util.detail,
          documentation: util.doc,
          insertText: name,
          range,
          sortText: `b_${name}`
        });
      });
      SNIPPETS.forEach(snippet => {
        suggestions.push({
          label: snippet.label,
          kind: KIND.Snippet,
          detail: '片段',
          documentation: snippet.doc,
          insertText: snippet.insert,
          insertTextRules: monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet,
          range,
          sortText: `c_${snippet.label}`
        });
      });
      return { suggestions };
    }
  });
}

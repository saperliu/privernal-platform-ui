/**
 * 自定义页面预置模板（设计器「自定义页面」页签一键插入）
 *
 * 模板即协议示例：
 *  - 编辑页：defineProps 拿上下文，defineExpose({ validate, getData }) 与 EBuilder 提交契约一致
 *    （弹窗 footer 统一走保存链：唯一性校验/backScript/子表/自动流程，自定义页只负责收集数据）
 *  - 列表页：pageApi.list 分页查询 + perm 控制按钮 + openAdd/openEdit 复用默认编辑弹窗
 *  - vue API 免导入（ref/watch/onMounted 直接用）；外部模块不可导入
 */

/** 编辑页模板：按字段清单自动铺开表单项，value 翻译/选项由 fields.options 提供 */
export const EDIT_PAGE_SAMPLE = `<template>
  <el-form ref="formRef" :model="model" label-width="110px" :disabled="mode === 'view'">
    <el-row :gutter="16">
      <el-col v-for="f in fields" :key="f.code" :span="12">
        <el-form-item :label="f.label" :prop="f.code" :rules="f.required ? [{ required: true, message: f.label + '不能为空', trigger: 'blur' }] : []">
          <!-- 按组件类型分派：select/radio 用 options，日期/数字/开关/其余走默认 -->
          <el-select
            v-if="f.type === 'select' || f.type === 'radio'"
            v-model="model[f.code]"
            clearable
            placeholder="请选择"
            style="width: 100%"
          >
            <el-option v-for="opt in f.options" :key="opt.value" :label="opt.label" :value="opt.value" />
          </el-select>
          <el-date-picker
            v-else-if="f.type === 'date-picker'"
            v-model="model[f.code]"
            type="date"
            value-format="YYYY-MM-DD"
            placeholder="请选择日期"
            style="width: 100%"
          />
          <el-input-number
            v-else-if="f.type === 'input-number' || f.type === 'number'"
            v-model="model[f.code]"
            :controls="false"
            style="width: 100%"
          />
          <el-switch v-else-if="f.type === 'switch'" v-model="model[f.code]" />
          <el-input
            v-else
            v-model="model[f.code]"
            :type="f.type === 'textarea' ? 'textarea' : 'text'"
            clearable
            placeholder="请输入"
          />
        </el-form-item>
      </el-col>
    </el-row>
  </el-form>
</template>

<script setup>
const props = defineProps({
  /** 行数据：add 为空对象，edit/view 为当前行 */
  data: { type: Object, default: () => ({}) },
  /** 'add' | 'edit' | 'view' */
  mode: { type: String, default: 'add' },
  /** 字段清单：[{ code, label, type, required, options }] */
  fields: { type: Array, default: () => [] },
  tableCode: String,
  formName: String,
  pageApi: Object
});

const model = ref({ ...props.data });
const formRef = ref();

// setData 换行数据（弹窗打开/切换数据）时同步进本地模型
watch(
  () => props.data,
  val => {
    model.value = { ...(val || {}) };
  }
);

// —— 提交契约：与 EBuilder 相同的 validate/getData，弹窗「确定」按它走统一保存链 ——
async function validate() {
  try {
    await formRef.value.validate();
    return true;
  } catch {
    return false;
  }
}
async function getData() {
  return { ...model.value };
}
defineExpose({ validate, getData });
</script>
`;

/** 列表页模板：查询区 + 表格（列翻译）+ 分页 + 权限按钮，openAdd/openEdit 复用默认编辑弹窗 */
export const LIST_PAGE_SAMPLE = `<template>
  <div class="flex-col h-full gap-12px">
    <el-form inline @submit.prevent>
      <el-form-item v-for="col in queryColumns" :key="col.filedCode" :label="col.filedName || col.filedCode">
        <el-input v-model="query[col.filedCode]" placeholder="请输入" clearable style="width: 180px" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="load(1)">查询</el-button>
        <el-button @click="resetQuery">重置</el-button>
      </el-form-item>
    </el-form>

    <div class="flex items-center gap-8px">
      <el-button v-if="pageApi.perm.add" type="primary" @click="pageApi.openAdd()">新增</el-button>
      <span class="text-12px opacity-60">{{ formName }}（自定义列表页）</span>
    </div>

    <el-table v-loading="loading" :data="rows" border stripe height="100%" class="flex-1-hidden">
      <el-table-column type="index" label="#" width="50" />
      <el-table-column
        v-for="col in listColumns"
        :key="col.filedCode"
        :prop="col.filedCode"
        :label="col.filedName || col.filedCode"
        min-width="140"
      >
        <template #default="{ row }">
          <!-- 翻译器把字典/人员/部门/关联 id 翻成文案；VNode 结果用函数组件包一层渲染 -->
          <component :is="cellFor(col.filedCode, row)" />
        </template>
      </el-table-column>
      <el-table-column v-if="pageApi.perm.edit || pageApi.perm.remove" label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button v-if="pageApi.perm.edit" link type="primary" @click="pageApi.openEdit(row)">编辑</el-button>
          <el-button v-if="pageApi.perm.remove" link type="danger" @click="handleRemove(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-pagination
      v-model:current-page="page"
      v-model:page-size="size"
      :total="total"
      layout="total, sizes, prev, pager, next"
      @current-change="load()"
      @size-change="load(1)"
    />
  </div>
</template>

<script setup>
const props = defineProps({
  tableCode: String,
  formName: String,
  /** 字段清单（列元数据） */
  fields: { type: Array, default: () => [] },
  /** 列配置（dynamic_form_column）：showList 列出列、showQuery 列出查询项 */
  columns: { type: Array, default: () => [] },
  perm: { type: Object, default: () => ({}) },
  pageApi: { type: Object, required: true }
});

const rows = ref([]);
const total = ref(0);
const loading = ref(false);
const page = ref(1);
const size = ref(20);
const query = ref({});
const translators = ref({});

const listColumns = computed(() => props.columns.filter(col => Number(col.showList) === 1));
const queryColumns = computed(() => props.columns.filter(col => Number(col.showQuery) === 1));

async function load(targetPage) {
  if (targetPage) page.value = targetPage;
  loading.value = true;
  try {
    const res = await props.pageApi.list({ pageNum: page.value, pageSize: size.value, ...query.value });
    rows.value = res.rows;
    total.value = res.total;
  } catch (e) {
    props.pageApi.message.error(e.message || '查询失败');
  } finally {
    loading.value = false;
  }
}

function resetQuery() {
  query.value = {};
  load(1);
}

/** 单元格渲染：翻译器命中返回 string 或 VNode（后者包成函数组件供 :is 渲染） */
function cellFor(code, row) {
  const value = row[code];
  const translator = translators.value[code];
  if (!translator) return String(value ?? '');
  const out = translator(value);
  if (typeof out === 'string' || typeof out === 'number') return String(out);
  return () => out;
}

async function handleRemove(row) {
  try {
    await props.pageApi.confirm('确定要删除该条数据吗？', '删除确认', { type: 'warning' });
    await props.pageApi.remove(row.id);
    props.pageApi.message.success('删除成功');
    load();
  } catch {
    /* 取消或失败静默 */
  }
}

onMounted(async () => {
  translators.value = await props.pageApi.createTranslators();
  load(1);
});
</script>
`;

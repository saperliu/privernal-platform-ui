<script setup lang="ts">
import { onMounted, ref } from 'vue';
import {
  ElButton as __forwarded_ElButton,
  ElCard as __forwarded_ElCard,
  ElDatePicker as __forwarded_ElDatePicker,
  ElDialog as __forwarded_ElDialog,
  ElForm as __forwarded_ElForm,
  ElFormItem as __forwarded_ElFormItem,
  ElInput as __forwarded_ElInput,
  ElInputNumber as __forwarded_ElInputNumber,
  ElPopconfirm as __forwarded_ElPopconfirm,
  ElRadioButton as __forwarded_ElRadioButton,
  ElRadioGroup as __forwarded_ElRadioGroup,
  ElSelect as __forwarded_ElSelect,
  ElSwitch as __forwarded_ElSwitch,
  ElTag as __forwarded_ElTag
} from 'element-plus';
import QRCode from 'qrcode';
import {
  createFormShare,
  deleteShare,
  fetchShareLink,
  fetchShareList,
  rotateShareToken,
  updateShare,
  updateShareStatus
} from '@/service/api/dynamic/advanced';

const props = defineProps<{
  form: { formId: string; tableCode: string; fieldOptions: Array<{ label: string; value: string }> };
}>();
const list = ref<AdvancedNamespace.ShareItem[]>([]);
const creating = ref(false);
const tokenModalVisible = ref(false);
const tokenModalText = ref('');
const shareType = ref<'FILL' | 'VIEW'>('FILL');

const draft = ref<AdvancedNamespace.ShareForm>(buildDraft());

function buildDraft(): AdvancedNamespace.ShareForm {
  return {
    formId: props.form.formId,
    shareType: 'FILL',
    scopeType: 'ANON_PUBLIC',
    password: null,
    expireTime: null,
    submitLimit: null,
    perPersonLimit: 1,
    editableAfterSubmit: 'N'
  };
}

async function load() {
  const { data, error } = await fetchShareList(props.form.formId);
  if (!error && data) {
    list.value = data;
  }
}

/** 链接类型切换：ElRadioGroup 的 change 载荷是无类型联合，只认 FILL/VIEW 两个取值 */
function switchType(value: string | number | boolean | undefined) {
  if (value === 'FILL' || value === 'VIEW') {
    shareType.value = value;
    draft.value.shareType = value;
    if (value === 'FILL') {
      draft.value.scopeType = 'ANON_PUBLIC';
    }
  }
}

async function create() {
  creating.value = true;
  try {
    const payload: AdvancedNamespace.ShareForm = {
      ...draft.value,
      formId: props.form.formId,
      // 后端 @JsonFormat(pattern="yyyy-MM-dd HH:mm:ss") 反序列化，控件 value-format 已同口径，勿转 ISO
      expireTime: draft.value.expireTime || null
    };
    const { data, error } = await createFormShare(payload);
    if (!error && data) {
      const kind = payload.shareType === 'FILL' ? '填写' : '查看';
      tokenModalText.value = [
        `外链创建成功，链接 token 只展示这一次（平台只存摘要，请立即复制）：`,
        ``,
        `token：${data.token}`,
        ``,
        `填写链接：{站点地址}/pub/form/${data.token}`,
        payload.shareType === 'VIEW' ? `查看链接：{站点地址}/pub/view/${data.token}` : ''
      ]
        .filter(Boolean)
        .join('\n');
      tokenModalVisible.value = true;
      window.$message?.success(`${kind}外链已创建`);
      await load();
    }
  } finally {
    creating.value = false;
  }
}

async function rotate(item: AdvancedNamespace.ShareItem) {
  const { data, error } = await rotateShareToken(item.id);
  if (!error && data) {
    tokenModalText.value = `旧链接已立即失效。新 token（只展示这一次）：\n\n${data.token}`;
    tokenModalVisible.value = true;
    await load();
  }
}

async function toggle(item: AdvancedNamespace.ShareItem, enabled: 'Y' | 'N') {
  const { error } = await updateShareStatus(item.id, enabled);
  if (!error) {
    window.$message?.success(enabled === 'Y' ? '已启用' : '已停用，链接立即 404');
    await load();
  } else {
    await load();
  }
}

async function remove(item: AdvancedNamespace.ShareItem) {
  const { error } = await deleteShare(item.id);
  if (!error) {
    window.$message?.success('已删除');
    await load();
  }
}

function scopeText(item: AdvancedNamespace.ShareItem) {
  if (item.shareType === 'FILL') return '公开填写';
  return (
    { ANON_PUBLIC: '公开链接', LOGIN_ALL: '内部共享（登录即可看）', LOGIN_DEPT: '内部共享（指定部门）' }[
      item.scopeType as 'ANON_PUBLIC' | 'LOGIN_ALL' | 'LOGIN_DEPT'
    ] || item.scopeType
  );
}

// ---------------- D2-① 链接回显 + 二维码 ----------------
const qrModalVisible = ref(false);
const qrUrl = ref('');
const qrCanvasRef = ref<HTMLCanvasElement>();

async function showLink(item: AdvancedNamespace.ShareItem) {
  const { data, error } = await fetchShareLink(item.id);
  if (!error && data) {
    qrUrl.value = data.url;
    qrModalVisible.value = true;
    // 等模态框渲染后再画码
    window.setTimeout(() => renderQr(300), 50);
  }
}

function renderQr(size: number) {
  if (!qrCanvasRef.value || !qrUrl.value) return;
  QRCode.toCanvas(qrCanvasRef.value, qrUrl.value, { width: size, margin: 2 }, () => {});
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(qrUrl.value);
    window.$message?.success('链接已复制');
  } catch {
    window.$message?.error('复制失败，请手动选择文本复制');
  }
}

function downloadQr(size: number) {
  if (!qrCanvasRef.value) return;
  // 重新以目标尺寸绘制到离屏画布再下载，保证打印清晰度
  const canvas = document.createElement('canvas');
  QRCode.toCanvas(canvas, qrUrl.value, { width: size, margin: 2 }, () => {
    const link = document.createElement('a');
    link.download = `share-qr-${size}px.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  });
}

// ---------------- D2-② 配置可改（update 不换 token） ----------------
const editModalVisible = ref(false);
const editingId = ref('');
const editing = ref<AdvancedNamespace.ShareForm>(buildDraft());

function scopeOptions() {
  return [
    { label: '公开链接（任何人）', value: 'ANON_PUBLIC' },
    { label: '内部共享（登录即可看）', value: 'LOGIN_ALL' },
    { label: '内部共享（指定部门）', value: 'LOGIN_DEPT' }
  ];
}

function openEdit(item: AdvancedNamespace.ShareItem) {
  editingId.value = item.id;
  editing.value = {
    formId: item.formId,
    shareType: item.shareType,
    scopeType: item.scopeType as AdvancedNamespace.ShareForm['scopeType'],
    scopeDeptIds: null,
    password: null,
    expireTime: item.expireTime,
    submitLimit: item.submitLimit,
    perPersonLimit: item.perPersonLimit || 1,
    editableAfterSubmit: item.editableAfterSubmit
  };
  editModalVisible.value = true;
}

async function saveEdit() {
  const payload: AdvancedNamespace.ShareForm = {
    ...editing.value,
    formId: props.form.formId,
    expireTime: editing.value.expireTime || null
  };
  const { error } = await updateShare(editingId.value, payload);
  if (!error) {
    window.$message?.success('配置已更新（token 与已发链接不变）');
    editModalVisible.value = false;
    await load();
  }
}

onMounted(load);

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElButton = __forwarded_ElButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElCard = __forwarded_ElCard;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDatePicker = __forwarded_ElDatePicker;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElForm = __forwarded_ElForm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElFormItem = __forwarded_ElFormItem;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInput = __forwarded_ElInput;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElInputNumber = __forwarded_ElInputNumber;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElDialog = __forwarded_ElDialog;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElPopconfirm = __forwarded_ElPopconfirm;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioGroup = __forwarded_ElRadioGroup;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElRadioButton = __forwarded_ElRadioButton;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSelect = __forwarded_ElSelect;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElSwitch = __forwarded_ElSwitch;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const ElTag = __forwarded_ElTag;
</script>

<template>
  <div class="share-panel">
    <ElCard title="新建外链" size="small" class="panel-card">
      <ElForm label-position="left" label-width="130" class="share-form">
        <ElFormItem label="链接类型">
          <ElRadioGroup v-model="draft.shareType" @change="switchType">
            <ElRadioButton value="FILL">外链填写（免登提交数据）</ElRadioButton>
            <ElRadioButton value="VIEW">外链查看（只读列表）</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem v-if="draft.shareType === 'VIEW'" label="可见范围">
          <ElRadioGroup v-model="draft.scopeType">
            <ElRadioButton value="ANON_PUBLIC">公开链接（任何人）</ElRadioButton>
            <ElRadioButton value="LOGIN_ALL">内部共享（登录即可看）</ElRadioButton>
            <ElRadioButton value="LOGIN_DEPT">内部共享（指定部门，部门配置 P1）</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem label="访问密码">
          <ElInput
            v-model="draft.password"
            type="password"
            show-password
            placeholder="可选；留空无需密码"
            class="narrow"
          />
        </ElFormItem>
        <ElFormItem label="有效期">
          <ElDatePicker
            v-model="draft.expireTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            placeholder="永久"
            class="narrow"
          />
        </ElFormItem>
        <ElFormItem v-if="draft.shareType === 'FILL'" label="提交次数上限">
          <ElInputNumber v-model="draft.submitLimit" :min="1" clearable placeholder="不限" class="narrow" />
        </ElFormItem>
        <ElFormItem v-if="draft.shareType === 'FILL'" label="每人限填">
          <ElInputNumber v-model="draft.perPersonLimit" :min="1" class="narrow" />
          <span class="hint">匿名按 IP+UA 指纹尽力防重</span>
        </ElFormItem>
        <ElFormItem v-if="draft.shareType === 'FILL'" label="提交后允许修改">
          <ElSwitch v-model="draft.editableAfterSubmit" active-value="Y" inactive-value="N" />
          <span class="hint">开启后填表人凭回执码可改自己那条（回执码只展示一次）</span>
        </ElFormItem>
        <ElFormItem label=" ">
          <ElButton type="primary" :loading="creating" @click="create">生成链接</ElButton>
        </ElFormItem>
      </ElForm>
    </ElCard>

    <ElCard title="已创建外链" size="small" class="panel-card">
      <div v-if="!list.length" class="empty-hint">还没有外链</div>
      <div v-for="item in list" :key="item.id" class="share-row">
        <div class="share-meta">
          <ElTag size="small" :type="item.shareType === 'FILL' ? 'success' : 'info'">
            {{ item.shareType === 'FILL' ? '填写' : '查看' }}
          </ElTag>
          <span class="scope">{{ scopeText(item) }}</span>
          <span class="tail">尾号 …{{ item.tokenTail }}</span>
          <span v-if="item.submitLimit != null" class="count">
            已提交 {{ item.submitCount }}/{{ item.submitLimit }}
          </span>
          <span v-else-if="item.shareType === 'FILL'" class="count">已提交 {{ item.submitCount }}</span>
        </div>
        <div class="share-ops">
          <ElButton size="small" type="primary" @click="showLink(item)">链接 / 二维码</ElButton>
          <ElButton size="small" @click="openEdit(item)">修改配置</ElButton>
          <ElButton size="small" @click="rotate(item)">轮换 token</ElButton>
          <ElButton
            size="small"
            :type="item.enabled === 'Y' ? 'warning' : 'primary'"
            @click="toggle(item, item.enabled === 'Y' ? 'N' : 'Y')"
          >
            {{ item.enabled === 'Y' ? '停用' : '启用' }}
          </ElButton>
          <ElPopconfirm
            title="删除后链接立即失效，确认删除？"
            confirm-button-text="确认"
            cancel-button-text="取消"
            @confirm="remove(item)"
          >
            <template #reference>
              <ElButton size="small" type="danger">删除</ElButton>
            </template>
          </ElPopconfirm>
        </div>
      </div>
    </ElCard>

    <ElDialog v-model="tokenModalVisible" preset="dialog" title="外链 token（只展示一次）" style="width: 560px">
      <pre class="token-pre">{{ tokenModalText }}</pre>
    </ElDialog>

    <ElDialog v-model="qrModalVisible" title="外链链接与二维码" style="width: 480px">
      <div class="qr-body">
        <div class="qr-url">{{ qrUrl }}</div>
        <canvas ref="qrCanvasRef" class="qr-canvas" />
        <div class="qr-ops">
          <ElButton size="small" type="primary" @click="copyLink">复制链接</ElButton>
          <ElButton size="small" @click="downloadQr(300)">下载 300px</ElButton>
          <ElButton size="small" @click="downloadQr(600)">下载 600px（打印）</ElButton>
        </div>
        <div class="qr-hint">轮换链接后旧二维码自动失效；链接回显功能需管理员在系统设置中开启</div>
      </div>
    </ElDialog>

    <ElDialog v-model="editModalVisible" title="修改外链配置（token 与已发链接不变）" style="width: 560px">
      <ElForm label-position="left" label-width="130">
        <ElFormItem label="链接类型">
          <ElRadioGroup v-model="editing.shareType">
            <ElRadioButton value="FILL">外链填写</ElRadioButton>
            <ElRadioButton value="VIEW">外链查看</ElRadioButton>
          </ElRadioGroup>
        </ElFormItem>
        <ElFormItem v-if="editing.shareType === 'VIEW'" label="可见范围">
          <ElSelect v-model="editing.scopeType" class="narrow">
            <ElOption v-for="opt in scopeOptions()" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem label="访问密码">
          <ElInput
            v-model="editing.password"
            type="password"
            show-password
            placeholder="留空清除密码门；输入则重设"
            class="narrow"
          />
        </ElFormItem>
        <ElFormItem label="有效期">
          <ElDatePicker
            v-model="editing.expireTime"
            type="datetime"
            value-format="YYYY-MM-DD HH:mm:ss"
            clearable
            placeholder="永久"
            class="narrow"
          />
        </ElFormItem>
        <ElFormItem label="提交次数上限">
          <ElInputNumber v-model="editing.submitLimit" :min="1" clearable placeholder="不限" class="narrow" />
        </ElFormItem>
        <ElFormItem label="每人限填">
          <ElInputNumber v-model="editing.perPersonLimit" :min="1" class="narrow" />
        </ElFormItem>
        <ElFormItem label="提交后允许修改">
          <ElSwitch v-model="editing.editableAfterSubmit" active-value="Y" inactive-value="N" />
        </ElFormItem>
        <ElFormItem label=" ">
          <ElButton type="primary" @click="saveEdit">保存</ElButton>
        </ElFormItem>
      </ElForm>
    </ElDialog>
  </div>
</template>

<style lang="scss" scoped>
.share-panel {
  max-width: 860px;
}

.panel-card {
  margin-bottom: 12px;
}

.narrow {
  width: 260px;
}

.share-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 4px;
  border-bottom: 1px dashed #eee;
}

.share-meta {
  display: flex;
  gap: 10px;
  align-items: center;
  font-size: 13px;
}

.share-ops {
  display: flex;
  gap: 8px;
}

.scope {
  color: #555;
}

.tail {
  font-family: monospace;
  color: #888;
}

.count {
  color: #999;
}

.empty-hint {
  padding: 16px;
  color: #999;
  text-align: center;
}

.hint {
  margin-left: 12px;
  font-size: 12px;
  color: #999;
}

.token-pre {
  padding: 12px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  background: #f7f7f7;
  border-radius: 6px;
}

.qr-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
  align-items: center;
}

.qr-url {
  width: 100%;
  padding: 8px;
  font-family: monospace;
  font-size: 12px;
  word-break: break-all;
  background: #f7f7f7;
  border-radius: 6px;
}

.qr-canvas {
  padding: 8px;
  border: 1px solid #eee;
  border-radius: 6px;
}

.qr-ops {
  display: flex;
  gap: 8px;
}

.qr-hint {
  font-size: 12px;
  color: #999;
  text-align: center;
}
</style>

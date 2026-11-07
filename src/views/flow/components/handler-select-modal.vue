<script setup lang="ts">
/**
 * 「经办人」选择弹窗：节点办理人/抄送人的多来源组合配置。
 *
 * 五个页签对应五类来源，产出的是**标识串**（不是具体人），拆解由后端在任务创建时完成：
 *  - 部门          → dept:{deptId}            部门全员
 *  - 人员          → user:{userId}            指定人
 *  - 角色          → role:{roleId}            角色成员
 *  - 人员部门控件   → script:INITIATOR / INITIATOR_DEPT / DATA_OWNER、常用规则、表单人员与部门组件
 *  - 业务逻辑查找   → script:LEVEL_MANAGER（逐层经理查找）、script:DEPT_ROLE（部门角色查找）
 *
 * 只 emit 标识数组，不碰流程 JSON；调用方写回 form.permissionFlag。
 */
import { computed, nextTick, reactive, ref, watch } from 'vue';
import type { TreeNodeData } from 'element-plus';
import {
  findDynamicFormByCode,
  findSystemDepartmentTree,
  findSystemRoleList,
  findSystemUserGroupList,
  findSystemUserList
} from '@/service';
import {
  type AnchorType,
  type HandlerKind,
  type HandlerNameMaps,
  COMMON_RULES as __forwarded_COMMON_RULES,
  CONTEXT_RULES as __forwarded_CONTEXT_RULES,
  LEVEL_OPTIONS as __forwarded_LEVEL_OPTIONS,
  buildFormFieldDeptFlag as __forwarded_buildFormFieldDeptFlag,
  buildFormFieldUserFlag as __forwarded_buildFormFieldUserFlag,
  buildDeptRoleFlag,
  buildLevelManagerFlag,
  describeFlag,
  joinFlags,
  splitFlags
} from '@/views/flow/components/handler-flags';

defineOptions({ name: 'HandlerSelectModal' });

const props = defineProps({
  show: { type: Boolean, default: false },
  /** 已选标识数组 */
  modelValue: { type: Array as () => string[], default: () => [] },
  /** 绑定表单编码：用于列出表单里的人员/部门组件字段 */
  tableCode: { type: String, default: '' },
  disabled: { type: Boolean, default: false }
});

const emit = defineEmits<{
  (e: 'update:show', value: boolean): void;
  (e: 'update:modelValue', value: string[]): void;
}>();
interface SelectedItem {
  flag: string;
  label: string;
  kind: HandlerKind;
}

const activeTab = ref('dept');
const loading = ref(false);
const loaded = ref(false);

const deptTree = ref<TreeNodeData[]>([]);
const users = ref<Array<{ id: string; name: string; departmentId: string }>>([]);
const roles = ref<Array<{ id: string; name: string }>>([]);
const groups = ref<Array<{ id: string; name: string }>>([]);
const formUserFields = ref<Array<{ field: string; label: string }>>([]);
const formDeptFields = ref<Array<{ field: string; label: string }>>([]);

const selected = ref<SelectedItem[]>([]);
const deptChecked = ref<Array<string | number>>([]);
const userKeyword = ref('');
const roleKeyword = ref('');
const deptPattern = ref('');
/** 人员页签：左树选中的部门，用于过滤右侧列表 */
const userDeptKey = ref<Array<string | number>>([]);
const userDeptId = ref('');

/** 部门树（部门页签，多选勾选形态）与人员页签左树（单选过滤形态）的引用：EP 树勾选回显靠 setCheckedKeys */
const deptTreeRef = ref<any>(null);

/** EP 树的 label/children 字段映射：后端部门节点用 deptName */
const TREE_PROPS = { label: 'deptName', children: 'children' } as const;

/** EP 树过滤：filter-node-method 按部门名包含匹配 */
function deptFilterNode(value: string, data: any) {
  if (!value) return true;
  return String(data.deptName ?? '').includes(value);
}

watch(deptPattern, value => {
  deptTreeRef.value?.filter?.(value);
});

/** 勾选回显：数据异步加载完 / 外部值变化后，都要等树渲染完再 setCheckedKeys（default-checked-keys 只在首渲染生效） */
watch([deptChecked, deptTree], () => {
  nextTick(() => {
    deptTreeRef.value?.setCheckedKeys?.(deptChecked.value.map(String));
  });
});

const selectedFlags = computed(() => new Set(selected.value.map(item => item.flag)));

function flagsOf(kinds: HandlerKind[]): string[] {
  return selected.value.filter(item => kinds.includes(item.kind)).map(item => item.flag);
}

/** 用新集合替换掉同一批 kind 的旧条目，避免跨页签互相覆盖 */
function replaceKind(kinds: HandlerKind[], items: SelectedItem[]) {
  selected.value = [...selected.value.filter(item => !kinds.includes(item.kind)), ...items];
}

/** 部门扁平索引（id → name），供 nameMaps / 锚点回显使用 */
const allDepts = ref<Array<{ id: string; name: string }>>([]);

function nameMaps(): HandlerNameMaps {
  return {
    users: Object.fromEntries(users.value.map(user => [user.id, user.name])),
    depts: Object.fromEntries(allDepts.value.map(dept => [dept.id, dept.name])),
    roles: Object.fromEntries(roles.value.map(role => [role.id, role.name])),
    groups: Object.fromEntries(groups.value.map(group => [group.id, group.name])),
    formFields: Object.fromEntries(
      [...formUserFields.value, ...formDeptFields.value].map(item => [item.field, item.label])
    )
  };
}

function flattenDept(nodes: any[]): Array<{ id: string; name: string }> {
  const out: Array<{ id: string; name: string }> = [];
  const walk = (list: any[]) => {
    list.forEach(node => {
      if (!node) return;
      out.push({ id: String(node.id ?? node.key), name: node.deptName ?? node.label ?? String(node.id) });
      if (Array.isArray(node.children) && node.children.length) walk(node.children);
    });
  };
  walk(nodes as any[]);
  return out;
}

async function ensureLoaded() {
  if (loaded.value) return;
  loading.value = true;
  try {
    const tasks: Array<Promise<any>> = [
      findSystemDepartmentTree({ deptName: '', pageSize: 10, pageNum: 1 } as any).then(res => {
        if (res.error === null && res.data) {
          deptTree.value = ((res.data as any).children ?? []) as TreeNodeData[];
          allDepts.value = flattenDept(deptTree.value);
        }
      }),
      findSystemUserList({ pageNum: 1, pageSize: 9999, keywords: [] } as any).then(res => {
        const rows = (res.data as any)?.list ?? (res.data as any)?.rows ?? [];
        users.value = rows.map((user: any) => ({
          id: String(user.id),
          name: user.nickName || user.loginName || String(user.id),
          departmentId: String(user.departmentId ?? '')
        }));
      }),
      findSystemRoleList({ pageNum: 1, pageSize: 500 } as any).then(res => {
        const rows = (res.data as any)?.list ?? (res.data as any)?.rows ?? [];
        roles.value = rows.map((role: any) => ({ id: String(role.id), name: role.roleName || String(role.id) }));
      }),
      findSystemUserGroupList({ pageNum: 1, pageSize: 500 } as any).then(res => {
        const rows = (res.data as any)?.list ?? (res.data as any)?.rows ?? [];
        groups.value = rows.map((group: any) => ({ id: String(group.id), name: group.groupName || String(group.id) }));
      })
    ];
    if (props.tableCode) {
      tasks.push(
        findDynamicFormByCode(props.tableCode).then(res => {
          const components = ((res.data as any)?.metaData?.inputComponents ?? []) as any[];
          const label = (item: any) => item.componentProps?.label || item.field;
          formUserFields.value = components
            .filter((item: any) => ['user-select', 'user-multi-select'].includes(item.type))
            .map((item: any) => ({ field: item.field, label: label(item) }));
          formDeptFields.value = components
            .filter((item: any) => ['dept-select', 'dept-multi-select'].includes(item.type))
            .map((item: any) => ({ field: item.field, label: label(item) }));
        })
      );
    }
    await Promise.all(tasks);
    loaded.value = true;
    syncSelectedFromModel();
  } catch {
    window.$message?.error('组织数据加载失败，请关闭后重试');
  } finally {
    loading.value = false;
  }
}

/** 外部值 → 已选条目（含历史裸值，未知前缀原样显示不丢弃） */
function syncSelectedFromModel() {
  const names = nameMaps();
  selected.value = splitFlags(props.modelValue).map(flag => ({ flag, ...describeFlag(flag, names) }));
  deptChecked.value = flagsOf(['dept']).map(flag => flag.slice('dept:'.length));
}

watch(
  () => props.show,
  show => {
    if (show) {
      activeTab.value = 'dept';
      ensureLoaded();
    }
  }
);

/** ===== 部门（树勾选 = 部门全员） ===== */
function onDeptChecked(_node: any, state: { checkedKeys: Array<string | number> }) {
  applyDeptChecked(state.checkedKeys);
}

function applyDeptChecked(keys: Array<string | number>) {
  deptChecked.value = keys;
  const names = nameMaps();
  replaceKind(
    ['dept'],
    keys.map(key => {
      const flag = `dept:${key}`;
      return { flag, kind: 'dept' as HandlerKind, label: names.depts?.[String(key)] || `部门#${key}` };
    })
  );
}

/** ===== 人员（左树过滤 + 右列表勾选） ===== */
function onUserDeptClick(data: any) {
  // 与设计器其它选人面板一致：点节点即切换过滤，再点空白不清空
  const id = String(data.id ?? '');
  userDeptKey.value = id ? [id] : [];
  userDeptId.value = id;
}

const filteredUsers = computed(() => {
  const keyword = userKeyword.value.trim().toLowerCase();
  return users.value.filter(user => {
    const byDept = !userDeptId.value || user.departmentId === userDeptId.value;
    const byKeyword = !keyword || user.name.toLowerCase().includes(keyword);
    return byDept && byKeyword;
  });
});

const userScopeLabel = computed(() => {
  if (!userDeptId.value) return '全部人员';
  return allDepts.value.find(dept => dept.id === userDeptId.value)?.name || '所选部门';
});

/** ===== 角色 ===== */
const filteredRoles = computed(() => {
  const keyword = roleKeyword.value.trim().toLowerCase();
  return keyword ? roles.value.filter(role => role.name.toLowerCase().includes(keyword)) : roles.value;
});

function toggleFlag(flag: string, kind: HandlerKind, label: string) {
  if (selectedFlags.value.has(flag)) {
    selected.value = selected.value.filter(item => item.flag !== flag);
    if (kind === 'dept') deptChecked.value = deptChecked.value.filter(key => `dept:${key}` !== flag);
    return;
  }
  selected.value = [...selected.value, { flag, kind, label }];
}

function contextChecked(flag: string) {
  return selectedFlags.value.has(flag);
}

/** ===== 业务逻辑查找 ===== */
const FUNCTION_CARDS = [
  {
    type: 'LEVEL_MANAGER',
    title: '逐层经理查找',
    desc: '以所选部门（或所选人员、发起人所在部门）为锚点，向上数指定层级，取那一个部门的经理。例如 A 的上级是 B、上上级是 C：设 1 级取 B 的经理，设 2 级取 C 的经理。'
  },
  { type: 'DEPT_ROLE', title: '部门角色查询', desc: '取所选部门（或所选人员、发起人所在部门）内持有指定角色的成员。' }
] as const;

const fx = reactive({
  visible: false,
  type: '' as '' | 'LEVEL_MANAGER' | 'DEPT_ROLE',
  anchorTab: 'dept' as 'dept' | 'user' | 'context',
  anchorType: 'initiator' as AnchorType,
  anchorId: '' as string,
  level: 1,
  roleId: '' as string
});

const fxUserKeyword = ref('');

function openFx(type: string) {
  fx.type = type as typeof fx.type;
  fx.anchorTab = 'dept';
  fx.anchorType = 'dept';
  fx.anchorId = '';
  fx.level = 1;
  fx.roleId = '';
  fxUserKeyword.value = '';
  fx.visible = true;
}

function pickFxDept(data: any) {
  const id = String(data.id ?? '');
  if (!id) return;
  fx.anchorType = 'dept';
  fx.anchorId = id;
}

/** 人员页签选中后的回显名（锚点标签用） */
const fxUserPickedName = ref('');

function pickFxUser(userId: string, name: string) {
  fx.anchorType = 'user';
  fx.anchorId = userId;
  fxUserPickedName.value = name;
}

const fxUsers = computed(() => {
  const keyword = fxUserKeyword.value.trim().toLowerCase();
  return keyword ? users.value.filter(user => user.name.toLowerCase().includes(keyword)) : users.value.slice(0, 200);
});

/** 顶部只读输入框：回显当前锚点，对应截图的「请从下方选择部门或人员」 */
const fxAnchorLabel = computed(() => {
  if (fx.anchorType === 'dept') {
    return allDepts.value.find(dept => dept.id === fx.anchorId)?.name || '';
  }
  if (fx.anchorType === 'user') {
    return fxUserPickedName.value;
  }
  return '发起人';
});

const fxRoleOptions = computed(() => roles.value.map(role => ({ label: role.name, value: role.id })));

function confirmFx() {
  const names = nameMaps();
  if (fx.anchorType !== 'initiator' && !fx.anchorId) {
    window.$message?.error('请先在下方选择部门或人员');
    return;
  }
  if (fx.type === 'DEPT_ROLE' && !fx.roleId) {
    window.$message?.error('请选择角色');
    return;
  }
  const flag =
    fx.type === 'DEPT_ROLE'
      ? buildDeptRoleFlag(fx.anchorType, fx.anchorId, fx.roleId)
      : buildLevelManagerFlag(fx.anchorType, fx.anchorId, fx.level);
  if (selectedFlags.value.has(flag)) {
    window.$message?.info('该条件已添加过');
    return;
  }
  selected.value = [...selected.value, { flag, kind: 'script' as HandlerKind, label: describeFlag(flag, names).label }];
  fx.visible = false;
}

/** ===== 提交 ===== */
function removeFlag(flag: string) {
  selected.value = selected.value.filter(item => item.flag !== flag);
  deptChecked.value = deptChecked.value.filter(key => `dept:${key}` !== flag);
}

function handleConfirm() {
  emit('update:modelValue', splitFlags(joinFlags(selected.value.map(item => item.flag))));
  emit('update:show', false);
}

const KIND_GROUP: Record<string, string> = {
  user: '人员',
  dept: '部门',
  deptLeader: '部门经理',
  orgLeader: '组织负责人',
  role: '角色',
  userGroup: '用户组',
  script: '规则与查找',
  raw: '其他'
};

/** 已选区按来源分组展示，避免几十个标签糊成一片 */
const groupedSelected = computed(() => {
  const out: Record<string, SelectedItem[]> = {};
  selected.value.forEach(item => {
    const key = KIND_GROUP[item.kind] || '其他';
    (out[key] ||= []).push(item);
  });
  return Object.entries(out);
});

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const COMMON_RULES = __forwarded_COMMON_RULES;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const CONTEXT_RULES = __forwarded_CONTEXT_RULES;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const LEVEL_OPTIONS = __forwarded_LEVEL_OPTIONS;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const buildFormFieldDeptFlag = __forwarded_buildFormFieldDeptFlag;

// 模板绑定显式转发（规避编译产物 setup 绑定缺失）
const buildFormFieldUserFlag = __forwarded_buildFormFieldUserFlag;
</script>

<template>
  <ElDialog
    :model-value="show"
    title="经办人"
    width="900px"
    :close-on-click-modal="false"
    append-to-body
    @update:model-value="(v: boolean) => emit('update:show', v)"
  >
    <div v-if="selected.length" class="mb-12px max-h-140px overflow-auto border border-gray-200 rounded-6px p-10px">
      <div v-for="group in groupedSelected" :key="group[0]" class="mb-6px flex flex-wrap items-center gap-6px">
        <span class="w-72px shrink-0 text-12px text-gray-400">{{ group[0] }}</span>
        <ElTag
          v-for="item in group[1]"
          :key="item.flag"
          closable
          size="small"
          :type="item.kind === 'raw' ? 'warning' : 'info'"
          @close="removeFlag(item.flag)"
        >
          {{ item.label }}
        </ElTag>
      </div>
    </div>
    <div v-else class="mb-12px border border-gray-200 rounded-6px p-12px text-13px text-gray-400">请从下方选择内容</div>

    <div v-loading="loading">
      <ElTabs v-model="activeTab">
        <ElTabPane name="dept" label="部门">
          <ElInput v-model="deptPattern" size="small" placeholder="搜索部门" clearable class="mb-8px" />
          <div class="h-330px overflow-auto">
            <!-- check-strictly＝勾选不级联（部门全员语义，不含子部门）；过滤走 filter + filter-node-method -->
            <ElTree
              ref="deptTreeRef"
              :data="deptTree"
              :props="TREE_PROPS"
              node-key="id"
              show-checkbox
              check-strictly
              :filter-node-method="deptFilterNode"
              @check="onDeptChecked"
            />
          </div>
          <div class="text-12px text-gray-400">
            勾选＝该部门全员（不含子部门）；要逐级向上找经理请用「业务逻辑查找」
          </div>
        </ElTabPane>

        <ElTabPane name="user" label="人员">
          <div class="h-330px flex overflow-hidden border border-gray-200">
            <div class="w-240px shrink-0 overflow-auto border-r border-gray-200 p-6px">
              <ElTree
                :data="deptTree"
                :props="TREE_PROPS"
                node-key="id"
                highlight-current
                :current-node-key="userDeptKey[0] as string | undefined"
                @node-click="onUserDeptClick"
              />
            </div>
            <div class="flex flex-col flex-1 overflow-hidden p-8px">
              <div class="mb-6px flex items-center gap-8px">
                <ElInput v-model="userKeyword" size="small" placeholder="搜索人员" clearable class="flex-1" />
                <span class="text-12px text-gray-400">{{ userScopeLabel }}</span>
              </div>
              <div class="flex-1 overflow-auto">
                <div v-for="user in filteredUsers" :key="user.id" class="py-4px">
                  <ElCheckbox
                    :model-value="selectedFlags.has(`user:${user.id}`)"
                    :disabled="disabled"
                    @change="toggleFlag(`user:${user.id}`, 'user', user.name)"
                  >
                    {{ user.name }}
                  </ElCheckbox>
                </div>
                <ElEmpty v-if="!filteredUsers.length" description="该范围内没有人员" />
              </div>
            </div>
          </div>
          <div class="text-12px text-gray-400">
            点左侧部门可只看该部门人员；要整部门或按角色取人请改用「部门」「角色」页签
          </div>
          <template v-if="groups.length">
            <ElDivider class="!my-8px" />
            <div class="mb-6px text-13px text-gray-500">用户组</div>
            <div class="flex flex-wrap gap-x-16px gap-y-6px">
              <ElCheckbox
                v-for="group in groups"
                :key="group.id"
                :model-value="selectedFlags.has(`userGroup:${group.id}`)"
                :disabled="disabled"
                @change="toggleFlag(`userGroup:${group.id}`, 'userGroup', group.name)"
              >
                {{ group.name }}
              </ElCheckbox>
            </div>
          </template>
        </ElTabPane>

        <ElTabPane name="role" label="角色">
          <ElInput v-model="roleKeyword" size="small" placeholder="搜索角色" clearable class="mb-8px" />
          <div class="h-330px overflow-auto">
            <div v-for="role in filteredRoles" :key="role.id" class="py-4px">
              <ElCheckbox
                :model-value="selectedFlags.has(`role:${role.id}`)"
                :disabled="disabled"
                @change="toggleFlag(`role:${role.id}`, 'role', role.name)"
              >
                {{ role.name }}
              </ElCheckbox>
            </div>
            <ElEmpty v-if="!filteredRoles.length" description="没有匹配的角色" />
          </div>
          <div class="text-12px text-gray-400">角色＝全组织持有该角色的人；限定到某个部门请用「部门角色查询」</div>
        </ElTabPane>

        <ElTabPane name="context" label="人员部门控件">
          <div class="h-330px overflow-auto">
            <div v-for="rule in CONTEXT_RULES" :key="rule.flag" class="mb-10px">
              <ElCheckbox
                :model-value="contextChecked(rule.flag)"
                :disabled="disabled"
                @change="toggleFlag(rule.flag, 'script', rule.label)"
              >
                {{ rule.label }}
              </ElCheckbox>
              <div class="pl-24px text-12px text-gray-400">{{ rule.desc }}</div>
            </div>
            <ElDivider class="!my-8px" />
            <div class="mb-6px text-13px text-gray-500">常用规则</div>
            <div v-for="rule in COMMON_RULES" :key="rule.flag" class="mb-6px">
              <ElCheckbox
                :model-value="contextChecked(rule.flag)"
                :disabled="disabled"
                @change="toggleFlag(rule.flag, 'script', rule.label)"
              >
                {{ rule.label }}
              </ElCheckbox>
              <span class="pl-8px text-12px text-gray-400">{{ rule.desc }}</span>
            </div>
            <ElDivider class="!my-8px" />
            <div class="mb-6px text-13px text-gray-500">表单里的人员组件</div>
            <div v-for="field in formUserFields" :key="field.field" class="mb-6px">
              <ElCheckbox
                :model-value="contextChecked(buildFormFieldUserFlag(field.field))"
                :disabled="disabled"
                @change="toggleFlag(buildFormFieldUserFlag(field.field), 'script', `${field.label}（表单人员）`)"
              >
                {{ field.label }}
              </ElCheckbox>
            </div>
            <div v-if="!formUserFields.length" class="mb-6px text-12px text-gray-400">
              本流程绑定的表单里没有人员组件
            </div>
            <div class="mb-6px mt-10px text-13px text-gray-500">表单里的部门组件</div>
            <div v-for="field in formDeptFields" :key="field.field" class="mb-6px">
              <ElCheckbox
                :model-value="contextChecked(buildFormFieldDeptFlag(field.field))"
                :disabled="disabled"
                @change="toggleFlag(buildFormFieldDeptFlag(field.field), 'script', `${field.label}（表单部门）`)"
              >
                {{ field.label }}
              </ElCheckbox>
            </div>
            <div v-if="!formDeptFields.length" class="text-12px text-gray-400">本流程绑定的表单里没有部门组件</div>
          </div>
        </ElTabPane>

        <ElTabPane name="fx" label="业务逻辑查找">
          <div class="h-330px overflow-auto">
            <div
              v-for="card in FUNCTION_CARDS"
              :key="card.type"
              class="mb-12px border border-gray-200 rounded-6px p-12px"
            >
              <div class="mb-4px flex items-center gap-10px">
                <span class="text-14px font-500">{{ card.title }}</span>
                <ElButton size="small" type="primary" text :disabled="disabled" @click="openFx(card.type)">
                  + 添加
                </ElButton>
              </div>
              <div class="text-12px text-gray-400">{{ card.desc }}</div>
            </div>
          </div>
        </ElTabPane>
      </ElTabs>
    </div>

    <template #footer>
      <div class="flex justify-end gap-10px">
        <ElButton @click="emit('update:show', false)">取消</ElButton>
        <ElButton type="primary" :disabled="disabled" @click="handleConfirm">确定</ElButton>
      </div>
    </template>

    <!-- 二级弹窗：锚点 + 参数（层级 / 角色），对应截图的「添加逐层经理函数」「添加角色查找函数」 -->
    <ElDialog
      v-model="fx.visible"
      :title="fx.type === 'DEPT_ROLE' ? '添加部门角色查询' : '添加逐层经理查找'"
      width="560px"
      append-to-body
    >
      <ElForm label-position="top" size="small">
        <ElFormItem label="请从下方选择部门或人员">
          <ElInput :model-value="fxAnchorLabel" placeholder="请从下方选择部门或人员" readonly class="w-full" />
        </ElFormItem>
        <ElFormItem v-if="fx.type === 'LEVEL_MANAGER'" label="设定部门层级">
          <ElSelect v-model="fx.level" placeholder="设定部门层级" class="w-full">
            <ElOption v-for="opt in LEVEL_OPTIONS" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
        <ElFormItem v-if="fx.type === 'DEPT_ROLE'" label="设定角色">
          <ElSelect v-model="fx.roleId" filterable placeholder="设定角色" class="w-full">
            <ElOption v-for="opt in fxRoleOptions" :key="opt.value" :label="opt.label" :value="opt.value" />
          </ElSelect>
        </ElFormItem>
      </ElForm>

      <ElTabs v-model="fx.anchorTab">
        <ElTabPane name="dept" label="部门">
          <div class="h-260px overflow-auto border border-gray-200 p-6px">
            <ElTree :data="deptTree" :props="TREE_PROPS" node-key="id" highlight-current @node-click="pickFxDept" />
          </div>
        </ElTabPane>
        <ElTabPane name="user" label="人员">
          <ElInput v-model="fxUserKeyword" size="small" placeholder="搜索人员" clearable class="mb-6px" />
          <div class="h-220px overflow-auto border border-gray-200 p-6px">
            <div
              v-for="user in fxUsers"
              :key="user.id"
              class="cursor-pointer rounded-4px px-8px py-5px hover:bg-gray-100"
              :class="{ 'bg-gray-100': fx.anchorType === 'user' && fx.anchorId === user.id }"
              @click="pickFxUser(user.id, user.name)"
            >
              {{ user.name }}
            </div>
            <ElEmpty v-if="!fxUsers.length" description="没有匹配的人员" />
          </div>
        </ElTabPane>
        <ElTabPane name="context" label="人员部门控件">
          <div
            class="cursor-pointer rounded-4px px-8px py-8px hover:bg-gray-50"
            :class="{ 'bg-gray-100': fx.anchorType === 'initiator' }"
            @click="fx.anchorType = 'initiator'"
          >
            发起人
          </div>
          <div class="mt-6px px-8px text-12px text-gray-400">以流程发起人为锚点，取其所属部门</div>
        </ElTabPane>
      </ElTabs>

      <template #footer>
        <div class="flex justify-end gap-10px">
          <ElButton @click="fx.visible = false">取消</ElButton>
          <ElButton type="primary" @click="confirmFx">确定</ElButton>
        </div>
      </template>
    </ElDialog>
  </ElDialog>
</template>

<style scoped>
:deep(.el-tabs__content) {
  overflow: visible;
}
</style>

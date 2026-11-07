import { ref } from 'vue';
import { findSystemDepartmentList, findSystemOrganizationList } from '@/service';

/**
 * 部门/组织 id → 名称映射（模块级缓存，四个动态表单列表共用一份请求）。
 * 后端列表接口只回 id，展示层用它翻译成名称
 */
const deptMap = ref<Map<string, string>>(new Map());
const orgMap = ref<Map<string, string>>(new Map());
let loaded = false;
let loading: Promise<void> | null = null;

async function loadNameMaps() {
  if (loaded) return;
  if (!loading) {
    loading = Promise.all([
      findSystemDepartmentList({ pageNum: 1, pageSize: 2000, keywords: [] } as any),
      findSystemOrganizationList({ pageNum: 1, pageSize: 2000, keywords: [] } as any)
    ])
      .then(([deptRes, orgRes]) => {
        const dm = new Map<string, string>();
        ((deptRes.data as any)?.list ?? []).forEach((d: any) => {
          if (d?.id) dm.set(String(d.id), d.deptName ?? d.departmentName ?? '');
        });
        const om = new Map<string, string>();
        ((orgRes.data as any)?.list ?? []).forEach((o: any) => {
          if (o?.id) om.set(String(o.id), o.organizationName ?? '');
        });
        deptMap.value = dm;
        orgMap.value = om;
        loaded = true;
      })
      .catch(() => {
        loading = null;
      });
  }
  await loading;
}

export function useDeptOrgNames() {
  loadNameMaps();
  return {
    /** 部门 id → 名称，未匹配时回退显示原 id */
    deptName(id: any) {
      if (id === null || id === undefined || id === '') return '';
      return deptMap.value.get(String(id)) ?? String(id);
    },
    /** 组织 id → 名称，未匹配时回退显示原 id */
    orgName(id: any) {
      if (id === null || id === undefined || id === '') return '';
      return orgMap.value.get(String(id)) ?? String(id);
    }
  };
}

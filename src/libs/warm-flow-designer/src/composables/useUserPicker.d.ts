/** 办理人选择弹窗的 props 形态（与 selectUser.vue 的 defineProps 对齐） */
export interface UseUserPickerProps {
    /** 弹窗显隐（v-model:userVisible） */
    userVisible?: boolean;
    /** 已选用户存储主键集合（v-model:selectUser） */
    selectUser?: any[];
    /** 已选办理人行（回显用） */
    permissionRows?: any[];
}
/** 办理人选择弹窗的 emit 形态（与 selectUser.vue 的 defineEmits 对齐） */
export interface UseUserPickerEmit {
    (e: 'update:userVisible', visible: boolean): void;
    (e: 'handleUserSelect', checkedItemList: any[]): void;
}
/**
 * 办理人选择弹窗（selectUser）的逻辑层：集中 state / 数据请求 / 勾选与已选维护，
 * 让 SFC 只保留模板与编排（Roadmap ④ selectUser 拆分的 useUserPicker + ⑥ 逻辑分层）。
 *
 * 行为与原 selectUser.vue 内联脚本完全一致，仅把 `proxy.$refs` / `proxy.$nextTick`
 * 替换为模板 ref（groupTreeRef / queryRef）与 vue 的 nextTick，去除 getCurrentInstance 依赖。
 *
 * @param props selectUser 的 props（userVisible / selectUser / permissionRows）
 * @param emit selectUser 的 emit（update:userVisible / handleUserSelect）
 * @author warm
 */
export declare function useUserPicker(props: UseUserPickerProps, emit: UseUserPickerEmit): {
    groupTreeRef: any;
    queryRef: any;
    tabsValue: import('vue').Ref<string>;
    tableList: import('vue').Ref<any[]>;
    loading: import('vue').Ref<boolean>;
    total: import('vue').Ref<number>;
    dateRange: import('vue').Ref<any[]>;
    groupName: import('vue').Ref<string>;
    groupOptions: any;
    treeCollapsed: import('vue').Ref<boolean>;
    mobileLoadingMore: import('vue').Ref<boolean>;
    mobileNoMore: import('vue').Ref<boolean>;
    tabsList: import('vue').Ref<any[]>;
    columns: import('vue').Ref<{
        key: number;
        label: string;
        visible: boolean;
    }[]>;
    checkedItemList: import('vue').Ref<any[]>;
    queryParams: import('vue').Ref<Record<string, any>>;
    checkAllInfo: import('vue').Ref<{
        isIndeterminate: boolean;
        isChecked: boolean;
    }>;
    getList: (append?: boolean) => void;
    onMobileScroll: (e: any) => void;
    handleNodeClick: (data: any) => void;
    tabChange: () => void;
    handleQuery: () => void;
    resetQuery: () => void;
    handleCheckAll: () => void;
    handleCheck: (row: any) => void;
    handleClose: (storageId: any) => void;
    clearAllSelected: () => void;
    submitForm: () => void;
};

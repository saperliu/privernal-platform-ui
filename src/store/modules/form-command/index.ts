import { defineStore } from 'pinia';
import { dataStatusEnableOrFinished } from '@/constants';
import { createRequiredFormRule } from '@/utils';
import { SetupStoreId } from '@/enum';

interface FormCommandState {
  /** 流程实例表单详情 */
  workflowInstanceForm: WorkflowInstanceFormNamespace.WorkflowInstanceFormForm | undefined;
  fieldMap: Map<string, WorkflowInstanceFormFieldTaskNamespace.WorkflowInstanceFormFieldTaskForm>;
  btnMap: Map<string, WorkflowInstanceFormBtnTaskNamespace.WorkflowInstanceFormBtnTaskForm>;
  editList: any[];
  deleteList: any[];
}

export const useFormCommandStore = defineStore(SetupStoreId.Form, {
  state: (): FormCommandState => ({
    workflowInstanceForm: undefined,
    fieldMap: new Map(),
    btnMap: new Map(),
    editList: [],
    deleteList: []
  }),
  actions: {
    /** 设置流程实例表单详情 */
    setWorkflowInstanceForm(info: WorkflowInstanceFormNamespace.WorkflowInstanceFormForm) {
      this.workflowInstanceForm = info;
      if (info && info.fieldDTOList) {
        info.fieldDTOList.forEach(item => {
          this.fieldMap.set(item.fieldValue, item);
        });
      }

      if (info && info.btnDTOList) {
        info.btnDTOList.forEach(item => {
          this.btnMap.set(item.fieldValue, item);
        });
      }
    },
    /**
     * 设置字段的必填规则
     *
     * @param info
     * @param rule
     */
    getFieldRule(info: WorkflowInstanceFormNamespace.WorkflowInstanceFormForm, rule: any) {
      if (info && info.fieldDTOList) {
        info.fieldDTOList.forEach(item => {
          if (item.isRequired === 1) {
            const msg = `请填写${item.fieldName}`;
            rule[item.fieldValue] = createRequiredFormRule(msg);
          } else {
            rule[item.fieldValue] = { required: false };
          }
        });
      }
      return rule;
    },

    /**
     * 判断字段是否可编辑
     *
     * @param name
     */
    hasFieldEdit(name: string) {
      const field = this.fieldMap.get(name);
      if (field !== undefined) {
        const { isEdit } = field;
        if (isEdit === 1 && this.workflowInstanceForm !== undefined && this.workflowInstanceForm.haveUser) {
          return true;
        }
      }
      return false;
    },
    /**
     * 判断字段是否可显示
     *
     * @param name 字段名
     */
    hasFieldShow(name: string) {
      const field = this.fieldMap.get(name);
      if (field !== undefined) {
        const { isShow } = field;
        if (isShow === 1) {
          return true;
        }
      }
      return false;
    },
    /** field MAP */
    getFieldStatus(name: string, attrName: string) {
      const field = this.fieldMap.get(name);
      if (attrName === 'show') {
        if (field !== undefined) {
          const { isShow } = field;
          return isShow === 1;
        }
        return true;
      }
      if (attrName === 'edit') {
        if (field !== undefined) {
          const { isEdit } = field;
          return isEdit === 1 && this.workflowInstanceForm !== undefined && this.workflowInstanceForm.haveUser;
        }
        return false;
      }
      if (attrName === 'must') {
        if (field !== undefined) {
          const { isRequired } = field;
          return isRequired === 1;
        }
        return false;
      }
      return false;
    },
    /** btn Map */
    getBtnMap(name: string) {
      return this.btnMap.get(name);
    },

    /**
     * 判断按钮是否可显示
     *
     * @param name 字段名
     */
    hasBtnShow(name: string) {
      const btn = this.btnMap.get(name);
      if (btn !== undefined) {
        const { status } = btn;
        if (status === dataStatusEnableOrFinished) {
          return true;
        }
      }
      return false;
    },

    /**
     * 保存编辑的数据
     *
     * @param data
     */
    saveEditList(data: any) {
      let flag = false;
      this.editList.forEach(item => {
        if (item.id === data.id) {
          flag = true;
          Object.assign(item, data);
        }
      });
      if (!flag) {
        this.editList.push(data);
      }
    },
    /**
     * 删除编辑的数据
     *
     * @param id
     */
    delEditList(id: string) {
      // 去掉已经被删除的数据
      this.editList = this.editList.filter(item => item.id !== id);
    },
    /**
     * 保存删除的数据
     *
     * @param data
     */
    saveDeleteList(data: any) {
      let flag = false;
      this.deleteList.forEach(item => {
        if (item === data) {
          flag = true;
        }
      });
      if (!flag) {
        this.deleteList.push(data);
      }
    },
    /** 获取删除列表 */
    getDeleteList() {
      return this.deleteList;
    },
    /** 初始化数组 */
    initDataList() {
      this.editList = [];
      this.deleteList = [];
    }
  }
});

export const usePageFormStore = defineStore('page-form-store', {
  state: (): FormCommandState => ({
    workflowInstanceForm: undefined,
    fieldMap: new Map(),
    btnMap: new Map(),
    editList: [],
    deleteList: []
  }),
  actions: {
    /** 设置流程实例表单详情 */
    setWorkflowInstanceForm(info: WorkflowInstanceFormNamespace.WorkflowInstanceFormForm) {
      this.workflowInstanceForm = info;
      if (info && info.fieldDTOList) {
        info.fieldDTOList.forEach(item => {
          this.fieldMap.set(item.fieldValue, item);
        });
      }

      if (info && info.btnDTOList) {
        info.btnDTOList.forEach(item => {
          this.btnMap.set(item.fieldValue, item);
        });
      }
    },
    /**
     * 设置字段的必填规则
     *
     * @param info
     * @param rule
     */
    getFieldRule(info: WorkflowInstanceFormNamespace.WorkflowInstanceFormForm, rule: any) {
      if (info && info.fieldDTOList) {
        info.fieldDTOList.forEach(item => {
          if (item.isRequired === 1) {
            const msg = `请填写${item.fieldName}`;
            rule[item.fieldValue] = createRequiredFormRule(msg);
          } else {
            rule[item.fieldValue] = { required: false };
          }
        });
      }
      return rule;
    },

    /**
     * 判断字段是否可编辑
     *
     * @param name
     */
    hasFieldEdit(name: string) {
      const field = this.fieldMap.get(name);
      if (field !== undefined) {
        const { isEdit } = field;
        if (isEdit === 1 && this.workflowInstanceForm !== undefined && this.workflowInstanceForm.haveUser) {
          return true;
        }
      }
      return false;
    },
    /**
     * 判断字段是否可显示
     *
     * @param name 字段名
     */
    hasFieldShow(name: string) {
      const field = this.fieldMap.get(name);
      if (field !== undefined) {
        const { isShow } = field;
        if (isShow === 1) {
          return true;
        }
      }
      return false;
    },
    /** field MAP */
    getFieldStatus(name: string, attrName: string) {
      const field = this.fieldMap.get(name);
      if (attrName === 'show') {
        if (field !== undefined) {
          const { isShow } = field;
          return isShow === 1;
        }
        return true;
      }
      if (attrName === 'edit') {
        if (field !== undefined) {
          const { isEdit } = field;
          return isEdit === 1 && this.workflowInstanceForm !== undefined && this.workflowInstanceForm.haveUser;
        }
        return false;
      }
      if (attrName === 'must') {
        if (field !== undefined) {
          const { isRequired } = field;
          return isRequired === 1;
        }
        return false;
      }
      return false;
    },
    /** btn Map */
    getBtnMap(name: string) {
      return this.btnMap.get(name);
    },

    /**
     * 判断按钮是否可显示
     *
     * @param name 字段名
     */
    hasBtnShow(name: string) {
      const btn = this.btnMap.get(name);
      if (btn !== undefined) {
        const { status } = btn;
        if (status === dataStatusEnableOrFinished) {
          return true;
        }
      }
      return false;
    },

    /**
     * 保存编辑的数据
     *
     * @param data
     */
    saveEditList(data: any) {
      let flag = false;
      this.editList.forEach(item => {
        if (item.id === data.id) {
          flag = true;
          Object.assign(item, data);
        }
      });
      if (!flag) {
        this.editList.push(data);
      }
    },
    /**
     * 删除编辑的数据
     *
     * @param id
     */
    delEditList(id: string) {
      // 去掉已经被删除的数据
      this.editList = this.editList.filter(item => item.id !== id);
    },
    /**
     * 保存删除的数据
     *
     * @param data
     */
    saveDeleteList(data: any) {
      let flag = false;
      this.deleteList.forEach(item => {
        if (item === data) {
          flag = true;
        }
      });
      if (!flag) {
        this.deleteList.push(data);
      }
    },
    /** 获取删除列表 */
    getDeleteList() {
      return this.deleteList;
    },
    /** 初始化数组 */
    initDataList() {
      this.editList = [];
      this.deleteList = [];
    }
  }
});

/** 脚本资产中心（skill-plan-upgrade §3-C1）相关类型 */

declare namespace ScriptNamespace {
  interface ScriptParamDef {
    name: string;
    type: 'STRING' | 'NUMBER' | 'DATE' | 'BOOLEAN' | 'JSON';
    required?: boolean;
    default?: any;
    description?: string;
  }

  interface ScriptAsset {
    id?: string;
    scriptCode: string;
    scriptName: string;
    category: 'VALIDATION' | 'CALC' | 'AUTOFILL' | 'DATA_OP';
    language?: 'GROOVY';
    body: string;
    paramsSchema?: string | ScriptParamDef[] | null;
    resultType: 'NONE' | 'BOOLEAN' | 'OBJECT';
    timeoutSeconds?: number;
    status?: 'DRAFT' | 'PUBLISHED' | 'DISABLED';
    version?: number;
    appId?: string | null;
    organizationId?: string | null;
    remark?: string | null;
    createdTime?: string;
  }

  interface ScriptBinding {
    id?: string;
    assetId: string;
    assetVersion?: number | null;
    formId?: string;
    tableCode?: string;
    bindPoint: 'SAVE_VALIDATE' | 'BACK_SCRIPT' | 'SCHEDULE' | 'LINKAGE_SCRIPT';
    /** JSON 字符串：{"资产参数名": "字段编码 | {{currentUser}} | {{now}} | 常量"} */
    paramMapping?: string | null;
    failMessage?: string | null;
    executionOrder?: number | null;
    enabled: 'Y' | 'N';
    /** 列表接口带回的资产信息（便于展示） */
    assetCode?: string;
    assetName?: string;
    resultType?: string;
    paramsSchema?: string | ScriptParamDef[] | null;
  }

  interface ScriptExecLog {
    id?: string;
    scriptCode?: string;
    version?: number;
    bindPoint?: string;
    success?: 'Y' | 'N';
    resultSummary?: string | null;
    errorMessage?: string | null;
    elapsedMs?: number | null;
    createdTime?: string;
  }
}

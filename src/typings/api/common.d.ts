/**
 * Namespace Api
 *
 * All backend api type
 */
declare namespace Api {
  namespace Common {
    /** common params of paginating（框架演示体系保留） */
    interface PaginatingCommonParams {
      /** current page number */
      current: number;
      /** page size */
      size: number;
      /** total count */
      total: number;
    }

    /** common params of paginating query list data */
    interface PaginatingQueryRecord<T = any> extends PaginatingCommonParams {
      records: T[];
    }

    /** 请求分页的数据（迁自 perfect-cloud-ui，业务口径） */
    interface RequestPage {
      pageSize: number;
      pageNum: number;
      keywords?: string[];
      keyword?: string;
      orderBy?: string;
      direction?: string;
    }

    /** 返回的分页的数据格式 */
    interface ResponsePage<T = any> {
      total: number;
      list: T[];
    }

    /** common search params of table */
    type CommonSearchParams = Pick<Common.RequestPage, 'pageSize' | 'pageNum'>;

    type OptionWithKey<K = string> = { value: K; label: string };

    /**
     * enable status
     *
     * - "1": enabled
     * - "0": disabled
     */
    type EnableStatus = '1' | '0';

    /** common record */
    type CommonRecord<T = any> = {
      /** record id */
      id: string;
      /** record creator */
      createdBy: string;
      /** record create time */
      createdTime: string;
      /** record updater */
      updatedBy: string;
      /** record update time */
      updatedTime: string;
      /** record status */
      status: EnableStatus | null;
    } & T;

    interface FormBase {
      /** 备注 */
      remark?: string;
      /** 租户号 */
      tenantId?: string;
      /** 乐观锁 */
      revision?: number;
      /** 创建时间 */
      createdTime?: string;
      /** 创建人 */
      createdBy?: string;
      /** 更新时间 */
      updatedTime?: string;
      /** 更新人 */
      updatedBy?: string;
      /** 删除时间 */
      deletedTime?: string;
      /** 删除人 */
      deletedBy?: string;
      /** 删除标识 */
      deletedFlag?: string;
    }
  }
}

/**
 * 历史别名：部分 d.ts 中以 ApiCommon 引用 Api.Common 命名空间
 *
 * 声明在 `Api` 之后并以命名空间转发，避免跨文件引用被判定为前向引用/未使用
 */
declare namespace ApiCommon {
  type RequestPage = Api.Common.RequestPage;
  type ResponsePage<T = any> = Api.Common.ResponsePage<T>;
  type FormBase = Api.Common.FormBase;
}

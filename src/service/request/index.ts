import type { AxiosRequestConfig, AxiosResponse } from 'axios';
import type { CustomAxiosRequestConfig } from '@privernal/axios';
import { BACKEND_ERROR_CODE, createFlatRequest, createRequest } from '@privernal/axios';
import { transformRequestData } from '@/service/request/transform';
import { useAuthStore } from '@/store/modules/auth';
import { localStg } from '@/utils/storage';
import { getServiceBaseURL } from '@/utils/service';
import { $t } from '@/locales';
import { getAuthorization, handleExpiredRequest, showErrorMsg } from './shared';
import type { RequestInstanceState } from './type';

const isHttpProxy = import.meta.env.VITE_HTTP_PROXY === 'Y';
const { baseURL, otherBaseURL } = getServiceBaseURL(import.meta.env, isHttpProxy);
export const request = createCustomRequest();

/**
 * `RequestInstanceState` 是 interface，不带隐式索引签名，直接作为 `State` 类型实参过不了
 * `State extends Record<string, unknown>` 的约束（TS2344），这里交叉一层索引签名
 */
type RequestInstanceStateData = Record<string, unknown> & RequestInstanceState;

const instance = createFlatRequest<App.Service.Response, unknown, RequestInstanceStateData>(
  {
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    }
  },
  {
    async onRequest(config) {
      const handleConfig = { ...config };
      if (handleConfig.headers) {
        // 数据转换
        const contentType = handleConfig.headers['Content-Type'] as UnionKey.ContentType;
        handleConfig.data = await transformRequestData(handleConfig.data, contentType);
      }
      // 设置token
      const Authorization = getAuthorization();
      Object.assign(handleConfig.headers, { Authorization });
      return handleConfig;
    },
    isBackendSuccess(response) {
      // when the backend response code is "0000"(default), it means the request is success
      // to change this logic by yourself, you can modify the `VITE_SERVICE_SUCCESS_CODE` in `.env` file
      return String(response.data.code) === import.meta.env.VITE_SERVICE_SUCCESS_CODE;
    },
    async onBackendFail(response, instanceAxios) {
      const authStore = useAuthStore();
      const responseCode = String(response.data.code);

      function handleLogout() {
        authStore.resetStore();
      }

      function logoutAndCleanup() {
        handleLogout();
        window.removeEventListener('beforeunload', handleLogout);

        instance.state.errMsgStack = instance.state.errMsgStack.filter(msg => msg !== response.data.msg);
      }

      // when the backend response code is in `logoutCodes`, it means the user will be logged out and redirected to login page
      const logoutCodes = import.meta.env.VITE_SERVICE_LOGOUT_CODES?.split(',') || [];
      if (logoutCodes.includes(responseCode)) {
        handleLogout();
        return null;
      }

      // when the backend response code is in `modalLogoutCodes`, it means the user will be logged out by displaying a modal
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(responseCode) && !instance.state.errMsgStack?.includes(response.data.msg)) {
        instance.state.errMsgStack = [...(instance.state.errMsgStack || []), response.data.msg];

        // prevent the user from refreshing the page
        window.addEventListener('beforeunload', handleLogout);

        window.$dialog?.error({
          title: $t('common.error'),
          content: response.data.msg,
          positiveText: $t('common.confirm'),
          maskClosable: false,
          closeOnEsc: false,
          onPositiveClick() {
            logoutAndCleanup();
          },
          onClose() {
            logoutAndCleanup();
          }
        });
        return null;
      }

      // when the backend response code is in `expiredTokenCodes`, it means the token is expired, and refresh token
      // the api `refreshToken` can not return error code in `expiredTokenCodes`, otherwise it will be a dead loop, should return `logoutCodes` or `modalLogoutCodes`
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(responseCode)) {
        const success = await handleExpiredRequest(instance.state);
        if (success) {
          const Authorization = getAuthorization();
          Object.assign(response.config.headers, { Authorization });

          return instanceAxios.request(response.config) as Promise<AxiosResponse>;
        }
      }
      return null;
    },
    transformBackendResponse(response) {
      if (response.data !== null) {
        return response.data.data;
      }
      return response.data;
    },
    onError(error) {
      // when the request is fail, you can show error message
      let message = error.message;
      let backendErrorCode = '';
      // get backend error message and code
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.msg || message;
        backendErrorCode = String(error.response?.data?.code || '');
      }

      // 把后端真实文案写回 error.message：业务失败时 axios 造的错误对象固定是
      // 'the backend request error'（见 packages/axios/src/index.ts），而调用方（如大屏取数
      // 失败的组件占位文案）读的就是 error.message —— 不写回去就只能看到一句没有信息量的通用串，
      // 「数据集 xxx 暂时熔断」「该图表类型至少需要一个维度字段」这类可排查的原因全被吞掉。
      if (message !== error.message) {
        error.message = message;
      }

      // the error message is displayed in the modal
      const modalLogoutCodes = import.meta.env.VITE_SERVICE_MODAL_LOGOUT_CODES?.split(',') || [];
      if (modalLogoutCodes.includes(backendErrorCode)) {
        return;
      }

      // when the token is expired, refresh token and retry request, so no need to show error message
      const expiredTokenCodes = import.meta.env.VITE_SERVICE_EXPIRED_TOKEN_CODES?.split(',') || [];
      if (expiredTokenCodes.includes(backendErrorCode)) {
        return;
      }
      showErrorMsg(instance.state, message);
    }
  }
);

export const demoRequest = createRequest<App.Service.DemoResponse, unknown, Record<string, unknown>>(
  {
    baseURL: otherBaseURL.demo
  },
  {
    async onRequest(config) {
      const { headers } = config;

      // set token
      const token = localStg.get('token');
      const Authorization = token ? `Bearer ${token}` : null;
      Object.assign(headers, { Authorization });

      return config;
    },
    isBackendSuccess(response) {
      // when the backend response code is "200", it means the request is success
      // you can change this logic by yourself
      return response.data.status === '200';
    },
    async onBackendFail(_response) {
      // when the backend response code is not "200", it means the request is fail
      // for example: the token is expired, refresh token and retry request
    },
    transformBackendResponse(response) {
      return response.data.result;
    },
    onError(error) {
      // when the request is fail, you can show error message

      let message = error.message;

      // show backend error message
      if (error.code === BACKEND_ERROR_CODE) {
        message = error.response?.data?.message || message;
      }

      window.$message?.error(message);
    }
  }
);

/**
 * 创建请求
 *
 * 说明：`instance<T>(...)` 显式指定第一个类型实参后，第二个实参 `R extends ResponseType` 只能取默认值
 * `'json'`（TS 不支持部分类型实参推断），其入参 `CustomAxiosRequestConfig<'json'>` 的 responseType 比
 * `AxiosRequestConfig` 的联合类型窄。这里仅在入参对象上做形状适配，不改变运行时行为：调用方传入的
 * `responseType`（如 'blob'）原样透传给 axios，返回值类型仍由泛型 T 决定。
 */
function createCustomRequest() {
  /**
   * get请求
   *
   * @param url - 请求地址
   * @param config - axios配置
   */
  function get<T>(url: string, config?: AxiosRequestConfig) {
    return instance<T>({ url, method: 'get', ...config } as CustomAxiosRequestConfig);
  }

  /**
   * post请求
   *
   * @param url - 请求地址
   * @param data - 请求的body的data
   * @param config - axios配置
   */
  function post<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return instance<T>({ url, method: 'post', data, ...config } as CustomAxiosRequestConfig);
  }
  /**
   * put请求
   *
   * @param url - 请求地址
   * @param data - 请求的body的data
   * @param config - axios配置
   */
  function put<T>(url: string, data?: any, config?: AxiosRequestConfig) {
    return instance<T>({ url, method: 'put', data, ...config } as CustomAxiosRequestConfig);
  }

  /**
   * delete请求
   *
   * @param url - 请求地址
   * @param config - axios配置
   */
  function handleDelete<T>(url: string, config: AxiosRequestConfig) {
    return instance<T>({ url, method: 'delete', ...config } as CustomAxiosRequestConfig);
  }

  return {
    get,
    post,
    put,
    delete: handleDelete
  };
}

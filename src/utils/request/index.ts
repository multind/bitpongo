import type { AxiosError, AxiosInstance, AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import axios from 'axios';
import { runtimeConfig } from '@/config/runtime';
import { useUserStore } from '@/store/modules/user.ts';
import router from '@/router';

const service: AxiosInstance = axios.create({
  baseURL: runtimeConfig.apiBaseUrl,
  withCredentials: false,
  timeout: 20000,
});

service.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const userStore = useUserStore();
    if (userStore.token) {
      config.headers['Authorization'] = `Bearer ${userStore.token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  },
);

service.interceptors.response.use(
  (response: AxiosResponse) => {
    const res = response.data;
    if (res.code !== 200) {
      // showToast(res.msg);
      return Promise.reject(res.msg || 'Error');
    } else {
      return res.data;
    }
  },
  (error: AxiosError) => {
    console.log('err' + error);

    // 检查是否为 401 错误
    if (error.response?.status === 401) {
      // 清除用户状态
      const userStore = useUserStore();
      userStore.logout();

      // 直接使用导入的路由器实例进行跳转
      router.push('/login');
    }

    // showToast(error.message);
    const message = (error.response?.data as { message?: string } | undefined)?.message || error.message;
    return Promise.reject(new Error(message));
  },
);

export const http = {
  get<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config) as unknown as Promise<T>;
  },

  post<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config) as unknown as Promise<T>;
  },

  put<T = any>(url: string, data?: object, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config) as unknown as Promise<T>;
  },

  delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config) as unknown as Promise<T>;
  },
};

export default service;

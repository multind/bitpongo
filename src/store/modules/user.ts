import { loginPassword } from '@/api';
import { useCookies } from '@vueuse/integrations/useCookies';
import { defineStore } from 'pinia';

const { VITE_TOKEN_KEY } = import.meta.env;
// const token = useCookies().get(VITE_TOKEN_KEY as string);

interface StoreUser {
  token: string;
  info: Record<any, any>;
}

export const useUserStore = defineStore('user', {
  state: (): StoreUser => ({
    token: '',
    info: {},
  }),
  getters: {
    getUserInfo(): any {
      return this.info || {};
    },
  },
  actions: {
    setInfo(info: any) {
      this.info = info ?? '';
    },
    async login(username: string, password: string) {
      try {
        const res = await loginPassword({ username, password });
        this.setInfo(res.info);
        this.token = res.token;
        return res;
      } catch (error) {
        console.error('Login failed', error);
        throw error;
      }
    },
    logout() {
      // 清除用户状态
      this.info = {};
      this.token = '';
      // 清除持久化的 cookie token
      useCookies().remove(VITE_TOKEN_KEY as string);
    },
  },
  persist: {
    pick: ['token', 'info'],
    storage: localStorage,
  },
});

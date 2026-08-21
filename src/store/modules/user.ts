import { deleteAccount as deleteAccountRequest, loginPassword, registerAccount } from '@/api';
import type { AuthSession, UserInfo } from '@/api';
import { useCookies } from '@vueuse/integrations/useCookies';
import { defineStore } from 'pinia';

const { VITE_TOKEN_KEY } = import.meta.env;
// const token = useCookies().get(VITE_TOKEN_KEY as string);

interface StoreUser {
  token: string;
  info: Partial<UserInfo>;
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
    setSession(session: AuthSession) {
      this.info = session.info;
      this.token = session.token;
    },
    setInfo(info: any) {
      this.info = info ?? {};
    },
    async login(username: string, password: string) {
      try {
        const res = await loginPassword({ username, password });
        this.setSession(res);
        return res;
      } catch (error) {
        console.error('Login failed', error);
        throw error;
      }
    },
    async register(name: string, email: string, password: string) {
      const session = await registerAccount({ name, email, password });
      this.setSession(session);
      return session;
    },
    logout() {
      // 清除用户状态
      this.info = {};
      this.token = '';
      // 清除持久化的 cookie token
      useCookies().remove(VITE_TOKEN_KEY as string);
    },
    async deleteAccount(password: string) {
      await deleteAccountRequest({ password });
      this.logout();
    },
  },
  persist: {
    pick: ['token', 'info'],
    storage: localStorage,
  },
});

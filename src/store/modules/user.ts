import { deleteAccount as deleteAccountRequest, loginPassword, registerAccount } from '@/api';
import type { AuthSession, UserInfo } from '@/api';
import { useCookies } from '@vueuse/integrations/useCookies';
import { defineStore } from 'pinia';
import { initializeSessionTimeZone, resetSessionTimeZone } from '@/mobile/session-timezone';
import { getUserProfile } from '@/api/profile';

const { VITE_TOKEN_KEY } = import.meta.env;
// const token = useCookies().get(VITE_TOKEN_KEY as string);

interface StoreUser {
  token: string;
  info: Partial<UserInfo>;
  profileGeneration: number;
}

export const useUserStore = defineStore('user', {
  state: (): StoreUser => ({
    token: '',
    info: {},
    profileGeneration: 0,
  }),
  getters: {
    getUserInfo(): any {
      return this.info || {};
    },
  },
  actions: {
    async syncProfile() {
      const token = this.token;
      if (!token) return;
      const generation = ++this.profileGeneration;
      try {
        const profile = await getUserProfile();
        if (token !== this.token || generation !== this.profileGeneration) return;
        this.info = { ...this.info, name: profile.name, upDownColor: profile.upDownColor };
      } catch {
        // A profile service outage must not invalidate an existing login.
      }
    },
    setSession(session: AuthSession) {
      this.profileGeneration++;
      this.info = session.info;
      this.token = session.token;
    },
    setInfo(info: any) {
      this.profileGeneration++;
      this.info = info ?? {};
    },
    async login(username: string, password: string) {
      try {
        const res = await loginPassword({ username, password });
        this.setSession(res);
        void initializeSessionTimeZone();
        void this.syncProfile();
        return res;
      } catch (error) {
        console.error('Login failed', error);
        throw error;
      }
    },
    async register(name: string, email: string, password: string) {
      const session = await registerAccount({ name, email, password });
      this.setSession(session);
      void initializeSessionTimeZone();
      void this.syncProfile();
      return session;
    },
    logout() {
      this.profileGeneration++;
      // 清除用户状态
      this.info = {};
      this.token = '';
      resetSessionTimeZone();
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

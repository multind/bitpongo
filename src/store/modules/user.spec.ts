import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import * as api from '@/api';
import { useUserStore } from './user';

vi.mock('@/api', () => ({
  deleteAccount: vi.fn(),
  loginPassword: vi.fn(),
}));

vi.mock('@vueuse/integrations/useCookies', () => ({
  useCookies: () => ({ remove: vi.fn() }),
}));

describe('user account deletion', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(api.deleteAccount).mockReset();
  });

  it('logs out only after the backend confirms deletion', async () => {
    vi.mocked(api.deleteAccount).mockResolvedValue(undefined);
    const store = useUserStore();
    store.token = 'access-token';
    store.info = { name: '用户' };

    await store.deleteAccount('secret');

    expect(api.deleteAccount).toHaveBeenCalledWith({ password: 'secret' });
    expect(store.token).toBe('');
    expect(store.info).toEqual({});
  });

  it('keeps the current session when deletion fails', async () => {
    vi.mocked(api.deleteAccount).mockRejectedValue(new Error('密码错误'));
    const store = useUserStore();
    store.token = 'access-token';
    store.info = { name: '用户' };

    await expect(store.deleteAccount('wrong-password')).rejects.toThrow('密码错误');

    expect(store.token).toBe('access-token');
    expect(store.info).toEqual({ name: '用户' });
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';

import * as api from '@/api';
import { useUserStore } from './user';

vi.mock('@/api', () => ({
  deleteAccount: vi.fn(),
  loginPassword: vi.fn(),
  registerAccount: vi.fn(),
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

describe('user registration', () => {
  beforeEach(() => {
    setActivePinia(createPinia());
    vi.mocked(api.registerAccount).mockReset();
  });

  it('stores the session returned by registration', async () => {
    const session = {
      token: 'new-access-token',
      info: { id: 8, name: '新用户', email: 'new@example.com' },
    };
    vi.mocked(api.registerAccount).mockResolvedValue(session);
    const store = useUserStore();

    await expect(store.register('新用户', 'new@example.com', 'abc12345')).resolves.toEqual(session);

    expect(api.registerAccount).toHaveBeenCalledWith({
      name: '新用户',
      email: 'new@example.com',
      password: 'abc12345',
    });
    expect(store.token).toBe('new-access-token');
    expect(store.info).toEqual(session.info);
  });

  it('keeps the current session when registration fails', async () => {
    vi.mocked(api.registerAccount).mockRejectedValue(new Error('邮箱已注册'));
    const store = useUserStore();
    store.token = 'current-token';
    store.info = { id: 1, name: '当前用户', email: 'current@example.com' };

    await expect(store.register('新用户', 'new@example.com', 'abc12345')).rejects.toThrow('邮箱已注册');

    expect(store.token).toBe('current-token');
    expect(store.info).toEqual({ id: 1, name: '当前用户', email: 'current@example.com' });
  });
});

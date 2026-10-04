import { createPinia, setActivePinia } from 'pinia';
import { beforeEach, expect, it, vi } from 'vitest';
import { useUserStore } from './user';
import { getUserProfile } from '@/api/profile';
vi.mock('@/api/profile', () => ({ getUserProfile: vi.fn() }));
beforeEach(() => {
  setActivePinia(createPinia());
  vi.resetAllMocks();
});
it('restores saved market colors for an existing login', async () => {
  const user = useUserStore();
  user.setSession({ token: 'session', info: { id: 1, name: 'Old', email: 'alice@example.com' } });
  vi.mocked(getUserProfile).mockResolvedValue({ name: 'Alice', country: '', introduction: '', upDownColor: 'RED_UP' });
  await user.syncProfile();
  expect(user.info).toEqual({ id: 1, name: 'Alice', email: 'alice@example.com', upDownColor: 'RED_UP' });
});
it('does not restore private profile data after logout while a request is pending', async () => {
  const user = useUserStore();
  user.setSession({ token: 'session', info: { id: 1, name: 'Old', email: 'alice@example.com' } });
  let finish!: (profile: Awaited<ReturnType<typeof getUserProfile>>) => void;
  vi.mocked(getUserProfile).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = user.syncProfile();
  user.logout();
  finish({ name: 'Alice', country: '', introduction: '', upDownColor: 'RED_UP' });
  await pending;
  expect(user.info).toEqual({});
  expect(user.token).toBe('');
});
it('does not overwrite newly saved profile data with an older pending synchronization', async () => {
  const user = useUserStore();
  user.setSession({ token: 'session', info: { id: 1, name: 'Old', email: 'alice@example.com' } });
  let finish!: (profile: Awaited<ReturnType<typeof getUserProfile>>) => void;
  vi.mocked(getUserProfile).mockImplementation(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      }),
  );
  const pending = user.syncProfile();
  user.setInfo({ ...user.info, name: 'Saved', upDownColor: 'RED_UP' });
  finish({ name: 'Old', country: '', introduction: '', upDownColor: 'GREEN_UP' });
  await pending;
  expect(user.info.name).toBe('Saved');
  expect(user.info.upDownColor).toBe('RED_UP');
});

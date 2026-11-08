import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import { useUserStore } from '@/store/modules/user';
import Avatar from './Avatar.vue';
const api = vi.hoisted(() => ({ getAvatar: vi.fn(), uploadAvatar: vi.fn(), deleteAvatar: vi.fn() }));
vi.mock('@/api/avatar', () => api);
let view: ReturnType<typeof mount>;
afterEach(() => {
  view?.unmount();
  delete window.ZhitoubaoBridge;
  vi.resetAllMocks();
});
function render() {
  window.ZhitoubaoBridge = {
    postMessage(message) {
      const { command, requestId } = JSON.parse(message);
      const result = command === 'getContext' ? { supportsAvatarPicker: true } : selected;
      window.__ZHITOUBAO_NATIVE_RESOLVE__?.(requestId, result);
    },
  };
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'one', info: { id: 1, name: 'Alice', email: 'alice@example.com' } });
  i18n.global.locale.value = 'en-us';
  view = mount(Avatar, { props: { editable: true }, global: { plugins: [pinia, i18n] } });
  return view;
}
const image = 'data:image/png;base64,aGVsbG8=';
let selected: string | null;
async function choose(data: string | null = image) {
  selected = data;
  await view.get('.avatar-upload').trigger('click');
  await flushPromises();
}
it('displays saved avatar, replaces it after upload, and removes it', async () => {
  api.getAvatar.mockResolvedValue({ imageData: image });
  api.uploadAvatar.mockResolvedValue({ imageData: image + 'new' });
  api.deleteAvatar.mockResolvedValue({ imageData: null });
  render();
  await flushPromises();
  expect(view.get('img').attributes('src')).toBe(image);
  await choose();
  expect(view.get('img').attributes('src')).toBe(image + 'new');
  await view.get('button[data-remove]').trigger('click');
  await flushPromises();
  expect(view.get('img').attributes('src')).not.toContain('data:image');
});
it('keeps the previous avatar on upload failure and does not upload when the picker is cancelled', async () => {
  api.getAvatar.mockResolvedValue({ imageData: image });
  api.uploadAvatar.mockRejectedValue(new Error('offline'));
  render();
  await flushPromises();
  await choose();
  expect(view.get('img').attributes('src')).toBe(image);
  expect(view.find('[role="alert"]').exists()).toBe(true);
  await choose(null);
  expect(api.uploadAvatar).toHaveBeenCalledTimes(1);
});
it('hides previous account image and ignores stale upload results after logout', async () => {
  api.getAvatar.mockResolvedValue({ imageData: image });
  let resolve!: (value: { imageData: string }) => void;
  api.uploadAvatar.mockImplementation(
    () =>
      new Promise((r) => {
        resolve = r;
      }),
  );
  render();
  await flushPromises();
  await choose();
  useUserStore().setSession({ token: '', info: { id: 0, name: '', email: '' } });
  await flushPromises();
  resolve({ imageData: image });
  await flushPromises();
  expect(view.get('img').attributes('src')).not.toContain('data:image');
  expect(view.get('.avatar-upload').attributes('disabled')).toBeDefined();
});

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
  vi.resetAllMocks();
});
function render() {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'one', info: { id: 1, name: 'Alice', email: 'alice@example.com' } });
  i18n.global.locale.value = 'en-us';
  view = mount(Avatar, { props: { editable: true }, global: { plugins: [pinia, i18n] } });
  return view;
}
const image = 'data:image/png;base64,aGVsbG8=';
async function choose(file: File) {
  const input = view.get('input[type="file"]');
  Object.defineProperty(input.element, 'files', { configurable: true, value: [file] });
  await input.trigger('change');
  await flushPromises();
}
it('displays saved avatar, replaces it after upload, and removes it', async () => {
  api.getAvatar.mockResolvedValue({ imageData: image });
  api.uploadAvatar.mockResolvedValue({ imageData: image + 'new' });
  api.deleteAvatar.mockResolvedValue({ imageData: null });
  render();
  await flushPromises();
  expect(view.get('img').attributes('src')).toBe(image);
  await choose(new File(['png'], 'photo.png', { type: 'image/png' }));
  expect(view.get('img').attributes('src')).toBe(image + 'new');
  await view.get('button[data-remove]').trigger('click');
  await flushPromises();
  expect(view.get('img').attributes('src')).not.toContain('data:image');
});
it('keeps previous image when upload fails and rejects oversized files locally', async () => {
  api.getAvatar.mockResolvedValue({ imageData: image });
  api.uploadAvatar.mockRejectedValue(new Error('offline'));
  render();
  await flushPromises();
  await choose(new File(['png'], 'x.png', { type: 'image/png' }));
  expect(view.get('img').attributes('src')).toBe(image);
  expect(view.find('[role="alert"]').exists()).toBe(true);
  await choose(new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'big.png', { type: 'image/png' }));
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
  await choose(new File(['png'], 'x.png', { type: 'image/png' }));
  useUserStore().setSession({ token: '', info: { id: 0, name: '', email: '' } });
  await flushPromises();
  resolve({ imageData: image });
  await flushPromises();
  expect(view.get('img').attributes('src')).not.toContain('data:image');
  expect(view.get('input').attributes('disabled')).toBeDefined();
});

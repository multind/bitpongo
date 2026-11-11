import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n, switchLang } from '@/i18n';
import { useUserStore } from '@/store/modules/user';
import Preferences from './index.vue';
const api = vi.hoisted(() => ({ getUserProfile: vi.fn(), saveUserProfile: vi.fn() }));
vi.mock('@/api/profile', () => api);
vi.mock('@/i18n', async (original) => ({ ...((await original()) as object), switchLang: vi.fn() }));
let wrapper: ReturnType<typeof mount>;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
const initial = { name: 'Alice', country: 'HK', introduction: 'Hello', upDownColor: 'GREEN_UP' };
async function render() {
  const pinia = createPinia();
  setActivePinia(pinia);
  useUserStore().setSession({ token: 'session', info: { id: 1, name: 'Alice', email: 'alice@example.com' } });
  i18n.global.locale.value = 'en-us';
  wrapper = mount(Preferences, {
    global: {
      plugins: [pinia, i18n],
      stubs: {
        NutCell: { props: ['title', 'desc'], template: '<span>{{title}} {{desc}}</span>' },
        NutPopup: { props: ['visible'], template: '<div v-if="visible"><slot /></div>' },
        RouterLink: { props: ['to'], template: '<a :href="to"><slot /></a>' },
      },
    },
  });
  await flushPromises();
  return wrapper;
}
it('links to notification information from preferences', async () => {
  api.getUserProfile.mockResolvedValue(initial);
  const view = await render();
  expect(view.get('[data-test="preference-notice"]').attributes('href')).toBe('/member/notice');
});
it('opens the existing color as a draft and cancel does not save', async () => {
  api.getUserProfile.mockResolvedValue(initial);
  const view = await render();
  await view.get('[data-test="preference-color"]').trigger('click');
  expect(view.get('input[value="GREEN_UP"]').element).toHaveProperty('checked', true);
  await view.get('input[value="RED_UP"]').setValue();
  await view.get('[data-test="preference-cancel"]').trigger('click');
  expect(api.saveUserProfile).not.toHaveBeenCalled();
  expect(view.get('[data-test="preference-color"]').text()).toContain('Green up');
});
it('saves only the color selection while preserving newly changed profile details', async () => {
  api.getUserProfile.mockResolvedValueOnce(initial).mockResolvedValue({ ...initial, name: 'Latest', introduction: 'New' });
  api.saveUserProfile.mockResolvedValue({ ...initial, name: 'Latest', introduction: 'New', upDownColor: 'RED_UP' });
  const view = await render();
  await view.get('[data-test="preference-color"]').trigger('click');
  await view.get('input[value="RED_UP"]').setValue();
  await view.get('[data-test="preference-confirm"]').trigger('click');
  await flushPromises();
  expect(api.saveUserProfile).toHaveBeenCalledWith({ ...initial, name: 'Latest', introduction: 'New', upDownColor: 'RED_UP' });
  expect(view.get('[data-test="preference-color"]').text()).toContain('Red up');
  expect(useUserStore().info.name).toBe('Latest');
});
it('keeps the sheet and selected color when saving fails', async () => {
  api.getUserProfile.mockResolvedValue(initial);
  api.saveUserProfile.mockRejectedValue(new Error('offline'));
  const view = await render();
  await view.get('[data-test="preference-color"]').trigger('click');
  await view.get('input[value="RED_UP"]').setValue();
  await view.get('[data-test="preference-confirm"]').trigger('click');
  await flushPromises();
  expect(view.find('[role="alert"]').exists()).toBe(true);
  expect(view.get('input[value="RED_UP"]').element).toHaveProperty('checked', true);
});
it('prevents writing a previous account draft after switching accounts', async () => {
  api.getUserProfile.mockResolvedValue(initial);
  const view = await render();
  await view.get('[data-test="preference-color"]').trigger('click');
  useUserStore().setSession({ token: 'other', info: { id: 2, name: 'Other', email: 'other@example.com' } });
  await flushPromises();
  expect(view.find('[data-test="preference-confirm"]').exists()).toBe(false);
  expect(api.saveUserProfile).not.toHaveBeenCalled();
});
it('shows all fifteen language choices without changing language on cancel', async () => {
  api.getUserProfile.mockResolvedValue(initial);
  const view = await render();
  await view.get('[data-test="preference-language"]').trigger('click');
  expect(view.findAll('input[type="radio"]')).toHaveLength(15);
  expect(view.find('input[value="ja"]').exists()).toBe(true);
  await view.get('input[value="zh-tw"]').setValue();
  await view.get('[data-test="preference-cancel"]').trigger('click');
  expect(i18n.global.locale.value).toBe('en-us');
  expect(switchLang).not.toHaveBeenCalled();
});
it('applies the selected language only on confirmation', async () => {
  api.getUserProfile.mockResolvedValue(initial);
  const view = await render();
  await view.get('[data-test="preference-language"]').trigger('click');
  await view.get('input[value="zh-tw"]').setValue();
  expect(switchLang).not.toHaveBeenCalled();
  await view.get('[data-test="preference-confirm"]').trigger('click');
  expect(switchLang).toHaveBeenCalledWith('zh-tw');
  expect(api.saveUserProfile).not.toHaveBeenCalled();
});
it('does not write old-account preferences if the account changes while refreshing profile', async () => {
  api.getUserProfile.mockResolvedValueOnce(initial);
  const view = await render();
  let resolve!: (value: typeof initial) => void;
  api.getUserProfile.mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done;
      }),
  );
  await view.get('[data-test="preference-color"]').trigger('click');
  await view.get('[data-test="preference-confirm"]').trigger('click');
  useUserStore().setSession({ token: 'other', info: { id: 2, name: 'Other', email: 'other@example.com' } });
  resolve(initial);
  await flushPromises();
  expect(api.saveUserProfile).not.toHaveBeenCalled();
  expect(view.find('[role="status"]').exists()).toBe(false);
});

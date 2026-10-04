import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import AppVersionCheck from './AppVersionCheck.vue';
const api = vi.hoisted(() => ({ getAppRelease: vi.fn(), getNativeContext: vi.fn() }));
vi.mock('@/api/content', () => ({ getAppRelease: api.getAppRelease }));
vi.mock('@/mobile/bridge', () => ({ getNativeContext: api.getNativeContext }));
let wrapper: ReturnType<typeof mount>;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
it('checks the native App version rather than the H5 bundle version and provides a store link', async () => {
  api.getNativeContext.mockResolvedValue({
    platform: 'ios',
    appVersion: '1.0.1+15',
    systemVersion: '26',
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  api.getAppRelease.mockResolvedValue({
    available: true,
    updateAvailable: true,
    latestVersion: '1.0.2',
    latestBuild: 20,
    storeUrl: 'https://apps.apple.com/app/id6473227759',
    releaseNotes: 'Bug fixes',
  });
  i18n.global.locale.value = 'en-us';
  wrapper = mount(AppVersionCheck, { global: { plugins: [i18n] } });
  await flushPromises();
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(api.getAppRelease).toHaveBeenCalledWith({ platform: 'ios', version: '1.0.1', build: 15 });
  expect(wrapper.get('a').attributes('href')).toBe('https://apps.apple.com/app/id6473227759');
});
it('shows unconfigured release information without falsely saying the App is up to date', async () => {
  api.getNativeContext.mockResolvedValue({
    platform: 'ios',
    appVersion: '1.0.1',
    systemVersion: '26',
    safeArea: { top: 0, bottom: 0, left: 0, right: 0 },
  });
  api.getAppRelease.mockResolvedValue({
    available: false,
    updateAvailable: false,
    latestVersion: '',
    latestBuild: 0,
    storeUrl: '',
    releaseNotes: '',
  });
  i18n.global.locale.value = 'en-us';
  wrapper = mount(AppVersionCheck, { global: { plugins: [i18n] } });
  await flushPromises();
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.text()).toContain('not configured');
  expect(wrapper.find('a').exists()).toBe(false);
  expect(api.getAppRelease).toHaveBeenCalledWith({ platform: 'ios', version: '1.0.1', build: undefined });
});

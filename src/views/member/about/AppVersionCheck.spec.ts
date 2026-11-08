import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import AppVersionCheck from './AppVersionCheck.vue';

const bridge = vi.hoisted(() => ({ getNativeContext: vi.fn(), checkNativeStoreUpdate: vi.fn() }));
vi.mock('@/mobile/bridge', () => bridge);
const legacy = vi.hoisted(() => vi.fn());
vi.mock('@/api/content', () => ({ getAppRelease: legacy }));
let wrapper: ReturnType<typeof mount>;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});

async function render(context: object | null) {
  bridge.getNativeContext.mockResolvedValue(context);
  i18n.global.locale.value = 'en-us';
  wrapper = mount(AppVersionCheck, { global: { plugins: [i18n] } });
  await flushPromises();
}

it('uses the native store check and links to the official listing', async () => {
  bridge.checkNativeStoreUpdate.mockResolvedValue('updateAvailable');
  await render({ platform: 'ios', supportsStoreUpdate: true });
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(bridge.checkNativeStoreUpdate).toHaveBeenCalledOnce();
  expect(legacy).not.toHaveBeenCalled();
  expect(wrapper.get('a').attributes('href')).toBe('https://apps.apple.com/app/id6473227759');
});

it.each([null, { platform: 'android' }])('shows store links without checking on unsupported clients', async (context) => {
  await render(context);
  expect(wrapper.find('button').exists()).toBe(false);
  expect(wrapper.findAll('a').length).toBe(context ? 1 : 2);
  expect(legacy).not.toHaveBeenCalled();
});

it('does not claim the app is current if the store cannot be checked', async () => {
  bridge.checkNativeStoreUpdate.mockResolvedValue('unavailable');
  await render({ platform: 'android', supportsStoreUpdate: true });
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.get('[role="status"]').text()).toContain('Unable to check');
  expect(wrapper.get('a').attributes('href')).toContain('play.google.com');
});

it('reports a confirmed up-to-date installation', async () => {
  bridge.checkNativeStoreUpdate.mockResolvedValue('upToDate');
  await render({ platform: 'android', supportsStoreUpdate: true });
  await wrapper.get('button').trigger('click');
  await flushPromises();
  expect(wrapper.get('[role="status"]').text()).toContain('up to date');
  expect(wrapper.find('a').exists()).toBe(false);
});

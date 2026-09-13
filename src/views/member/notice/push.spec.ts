import { defineComponent } from 'vue';
import { flushPromises, mount } from '@vue/test-utils';
import { beforeEach, describe, expect, it, vi } from 'vitest';
const mocks = vi.hoisted(() => ({
  getPushSettings: vi.fn(),
  getPushDevices: vi.fn(),
  savePushSettings: vi.fn(),
  revokePushDevice: vi.fn(),
  testPush: vi.fn(),
  pushGetStatus: vi.fn(),
  pushOpenSettings: vi.fn(),
  pushRequestPermission: vi.fn(),
  pushSyncSession: vi.fn(),
  pushClearSession: vi.fn(),
}));
vi.mock('@/api/push', () => ({ ...mocks, pushLocale: () => 'en-US' }));
vi.mock('@/mobile/bridge', () => ({
  ...mocks,
  unsupportedPush: { supported: false, configured: false, permission: 'unavailable', registered: false, installationId: null },
}));
vi.mock('@/store/modules/user', () => ({ useUserStore: () => ({ token: 'jwt', info: { id: 7 } }) }));
vi.mock('@/mobile/app-context', () => ({ displayTimeZone: () => 'UTC' }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: { value: 'en-us' } }) }));
import View from './index.vue';
const prefs = {
  available: true,
  enabled: true,
  tradeSucceeded: true,
  tradeFailed: true,
  planAlerts: true,
  systemAlerts: true,
  soundEnabled: true,
  locale: 'en-US',
  timezone: 'UTC',
  deviceCount: 1,
};
const status = { supported: true, configured: true, permission: 'authorized', registered: true, installationId: 'device-1', error: null };
const button = defineComponent({ props: { disabled: Boolean }, template: '<button :disabled="disabled"><slot /></button>' });
const render = () => mount(View, { global: { stubs: { 'nut-button': button } } });
beforeEach(() => {
  vi.clearAllMocks();
  mocks.getPushSettings.mockResolvedValue({ ...prefs });
  mocks.getPushDevices.mockResolvedValue([{ installationId: 'device-1', platform: 'ios', appVersion: '1', enabled: true }]);
  mocks.pushGetStatus.mockResolvedValue({ ...status });
  mocks.pushSyncSession.mockImplementation(() => mocks.pushGetStatus());
  mocks.savePushSettings.mockResolvedValue({ ...prefs });
  mocks.testPush.mockResolvedValue({ queued: true });
});
describe('native notification settings', () => {
  it('reconciles a remote revocation on refresh and only re-enables after explicit action', async () => {
    const view = render();
    await flushPromises();
    expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeUndefined();
    expect(view.find('[data-test="push-enable-device"]').exists()).toBe(false);
    // Native cached status deliberately remains registered until explicit re-enable.
    mocks.getPushDevices.mockResolvedValue([{ installationId: 'device-1', platform: 'ios', appVersion: '1', enabled: false }]);
    const syncCount = mocks.pushSyncSession.mock.calls.length;
    await view.get('[data-test="push-refresh"]').trigger('click');
    await flushPromises();
    expect(mocks.pushSyncSession).toHaveBeenCalledTimes(syncCount + 1);
    expect(view.get('[data-test="push-device-state"]').text()).toBe('Disabled');
    expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeDefined();
    expect(view.text()).toContain('This device is not registered');
    expect(mocks.pushRequestPermission).not.toHaveBeenCalled();
    mocks.pushRequestPermission.mockImplementation(async () => {
      mocks.getPushDevices.mockResolvedValue([{ installationId: 'device-1', platform: 'ios', appVersion: '1', enabled: true }]);
      return { ...status };
    });
    await view.get('[data-test="push-enable-device"]').trigger('click');
    await flushPromises();
    expect(mocks.pushRequestPermission).toHaveBeenCalledTimes(1);
    expect(view.get('[data-test="push-device-state"]').text()).toBe('Enabled');
    expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeUndefined();
    expect(view.find('[data-test="push-enable-device"]').exists()).toBe(false);
  });
  it('saves preferences without read-only fields', async () => {
    const view = render();
    await flushPromises();
    await view.get('[data-test="soundEnabled"]').setValue(false);
    await view.get('[data-test="push-save"]').trigger('click');
    await flushPromises();
    expect(mocks.savePushSettings).toHaveBeenCalledWith({
      enabled: true,
      tradeSucceeded: true,
      tradeFailed: true,
      planAlerts: true,
      systemAlerts: true,
      soundEnabled: false,
      locale: 'en-US',
      timezone: 'UTC',
    });
    expect(view.text()).toContain('Preferences saved');
  });
  it('reports queue acceptance without claiming delivery', async () => {
    const view = render();
    await flushPromises();
    await view.get('[data-test="push-test"]').trigger('click');
    await flushPromises();
    expect(mocks.testPush).toHaveBeenCalledWith('device-1');
    expect(view.text()).toContain('Delivery is not yet confirmed');
  });
  it('disables test for denied permission and shows OS settings', async () => {
    mocks.pushGetStatus.mockResolvedValue({ ...status, permission: 'denied', registered: false });
    const view = render();
    await flushPromises();
    expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeDefined();
    expect(view.text()).toContain('Open system settings');
  });
  it('keeps web preferences usable and handles server errors', async () => {
    mocks.pushGetStatus.mockResolvedValue({ ...status, supported: false, registered: false });
    mocks.savePushSettings.mockRejectedValue(new Error('unavailable'));
    const view = render();
    await flushPromises();
    expect(view.text()).toContain('supported Bitpongo app');
    await view.get('[data-test="push-save"]').trigger('click');
    await flushPromises();
    expect(view.get('[role="alert"]').text()).toContain('Please try again');
  });
});

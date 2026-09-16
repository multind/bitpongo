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
  locale: { value: 'en-us' },
}));
vi.mock('@/api/push', () => ({ ...mocks, pushLocale: () => 'en-US' }));
vi.mock('@/mobile/bridge', () => ({
  ...mocks,
  unsupportedPush: { supported: false, configured: false, permission: 'unavailable', registered: false, installationId: null },
}));
vi.mock('@/store/modules/user', () => ({ useUserStore: () => ({ token: 'jwt', info: { id: 7 } }) }));
vi.mock('@/mobile/app-context', () => ({ displayTimeZone: () => 'UTC' }));
vi.mock('vue-i18n', () => ({ useI18n: () => ({ locale: mocks.locale }) }));
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
  mocks.locale.value = 'en-us';
  mocks.getPushSettings.mockResolvedValue({ ...prefs });
  mocks.getPushDevices.mockResolvedValue([{ installationId: 'device-1', platform: 'ios', appVersion: '1', enabled: true }]);
  mocks.pushGetStatus.mockResolvedValue({ ...status });
  mocks.pushSyncSession.mockImplementation(() => mocks.pushGetStatus());
  mocks.savePushSettings.mockResolvedValue({ ...prefs });
  mocks.testPush.mockResolvedValue({ queued: true });
});
describe('native notification settings', () => {
  it.each(['invalid_request', 'permission_unavailable', 'token_unavailable', 'registration_failed', 'cleanup_pending'])(
    'shows safe native error %s after allowing notifications instead of swallowing it',
    async (code) => {
      mocks.pushGetStatus.mockResolvedValue({ ...status, registered: false });
      mocks.getPushDevices.mockResolvedValue([]);
      mocks.pushRequestPermission.mockResolvedValue({ ...status, registered: false, error: code });
      const view = render();
      await flushPromises();
      await view.get('[data-test="push-enable-device"]').trigger('click');
      await flushPromises();
      expect(view.get('[data-test="push-native-error"]').text()).toContain(code);
      expect(view.get('[data-test="push-diagnostics"]').text()).toContain('authorized');
      expect(view.get('[data-test="push-native-registered"]').text()).toBe('No');
      expect(view.get('[data-test="push-server-registered"]').text()).toBe('No');
      expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeDefined();
      expect(view.text()).not.toContain('Please try again');
    },
  );
  it('shows an error returned by the follow-up session sync after permission succeeds', async () => {
    mocks.pushGetStatus.mockResolvedValue({ ...status, registered: false });
    mocks.getPushDevices.mockResolvedValue([]);
    mocks.pushRequestPermission.mockResolvedValue({ ...status, registered: false });
    const view = render();
    await flushPromises();
    mocks.pushSyncSession.mockResolvedValue({ ...status, registered: false, error: 'registration_failed' });
    await view.get('[data-test="push-enable-device"]').trigger('click');
    await flushPromises();
    expect(view.get('[data-test="push-native-error"]').text()).toContain('registration_failed');
  });
  it('shows initial session sync failure rather than an earlier healthy status', async () => {
    mocks.pushSyncSession.mockResolvedValue({ ...status, registered: false, error: 'registration_failed' });
    const view = render();
    await flushPromises();
    expect(view.get('[data-test="push-native-error"]').text()).toContain('registration_failed');
    expect(view.get('[data-test="push-native-registered"]').text()).toBe('No');
  });
  it('does not claim the server device is absent when the device list request fails', async () => {
    mocks.pushGetStatus.mockResolvedValue({ ...status, registered: false, error: 'token_unavailable' });
    mocks.getPushDevices.mockRejectedValue(new Error('private-response'));
    const view = render();
    await flushPromises();
    expect(view.get('[data-test="push-native-error"]').text()).toContain('token_unavailable');
    expect(view.get('[data-test="push-server-registered"]').text()).toBe('Unknown');
    expect(view.text()).not.toContain('private-response');
    expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeDefined();
  });
  it('does not re-enable a natively registered device when server status becomes unknown', async () => {
    const view = render();
    await flushPromises();
    mocks.getPushDevices.mockRejectedValue(new Error('offline'));
    await view.get('[data-test="push-refresh"]').trigger('click');
    await flushPromises();
    expect(view.get('[data-test="push-server-registered"]').text()).toBe('Unknown');
    expect(view.find('[data-test="push-enable-device"]').exists()).toBe(false);
    expect(view.find('.device-row').exists()).toBe(false);
    expect(view.text()).not.toContain('This device is not registered');
    expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeDefined();
  });
  it('keeps an unrelated preference save failure separate from healthy native status', async () => {
    mocks.savePushSettings.mockRejectedValue(new Error('server-private-message'));
    const view = render();
    await flushPromises();
    await view.get('[data-test="push-save"]').trigger('click');
    await flushPromises();
    expect(view.find('[data-test="push-native-error"]').exists()).toBe(false);
    expect(view.get('[role="alert"]').text()).toContain('Please try again');
    expect(view.text()).not.toContain('server-private-message');
  });
  it('retains native diagnostics when the account settings API fails', async () => {
    mocks.getPushSettings.mockRejectedValue(new Error('network error with secret-jwt'));
    mocks.pushGetStatus.mockResolvedValue({ ...status, registered: false, error: 'token_unavailable' });
    const view = render();
    await flushPromises();
    expect(view.get('[data-test="push-native-error"]').text()).toContain('token_unavailable');
    expect(view.get('[data-test="push-server-registered"]').text()).toBe('Unknown');
    expect(view.text()).not.toContain('secret-jwt');
  });
  it.each(['en-us', 'zh-cn', 'zh-tw'])('renders safe diagnostics in %s and clears them after successful refresh', async (language) => {
    mocks.locale.value = language;
    mocks.pushGetStatus.mockResolvedValue({ ...status, registered: false, error: 'token_unavailable' });
    const view = render();
    await flushPromises();
    expect(view.get('[data-test="push-native-error"]').text()).toContain('token_unavailable');
    mocks.pushGetStatus.mockResolvedValue({ ...status });
    await view.get('[data-test="push-refresh"]').trigger('click');
    await flushPromises();
    expect(view.find('[data-test="push-native-error"]').exists()).toBe(false);
    expect(view.get('[data-test="push-test"]').attributes('disabled')).toBeUndefined();
  });
  it.each(['FCM-secret jwt-secret', '__proto__', 'constructor'])(
    'does not render unknown native error text or additional sensitive fields: %s',
    async (untrustedError) => {
      mocks.pushGetStatus.mockResolvedValue({
        ...status,
        registered: false,
        error: untrustedError,
        permission: 'permission-secret',
        accessToken: 'jwt-secret',
        token: 'FCM-secret',
        details: 'details-secret',
      });
      const view = render();
      await flushPromises();
      expect(view.get('[data-test="push-native-error"]').text()).toContain('unknown_error');
      for (const secret of [untrustedError, 'jwt-secret', 'FCM-secret', 'permission-secret', 'details-secret']) {
        expect(view.html()).not.toContain(secret);
      }
    },
  );
  it('allows explicit removal of a disabled remote device', async () => {
    mocks.getPushDevices.mockResolvedValue([{ installationId: 'remote-device', platform: 'android', appVersion: '1', enabled: false }]);
    mocks.revokePushDevice.mockResolvedValue(undefined);
    const view = render();
    await flushPromises();
    const remove = view.get('.device-row button');
    expect(remove.attributes('disabled')).toBeUndefined();
    await remove.trigger('click');
    await flushPromises();
    expect(mocks.revokePushDevice).toHaveBeenCalledExactlyOnceWith('remote-device');
    expect(mocks.pushClearSession).not.toHaveBeenCalled();
    expect(view.text()).toContain('Device removed');
  });
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

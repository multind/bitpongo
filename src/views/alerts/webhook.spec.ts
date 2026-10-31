import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import WebhookPage from './webhook.vue';
import { getWebhooks, webhookAvailable, createWebhook, saveWebhook, activateWebhook } from '@/api/webhooks';
vi.mock('@/api/webhooks', () => ({
  getWebhooks: vi.fn(),
  webhookAvailable: vi.fn(),
  createWebhook: vi.fn(),
  saveWebhook: vi.fn(),
  activateWebhook: vi.fn(),
  revokeWebhook: vi.fn(),
}));
vi.mock('@/config/runtime', () => ({ runtimeConfig: { apiBaseUrl: 'https://api.example.test/api' } }));
let wrapper: ReturnType<typeof mount>;
const draftRule = {
  id: 1,
  name: 'Saved draft',
  description: 'Signals',
  keywords: 'BTC ETH',
  allowedIps: '192.0.2.1',
  status: 'DRAFT',
  publicId: 'test-public-id',
};
beforeEach(() => {
  vi.mocked(getWebhooks).mockResolvedValue([]);
  vi.mocked(webhookAvailable).mockResolvedValue(true);
  vi.mocked(createWebhook).mockResolvedValue(2);
});
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
  i18n.global.locale.value = 'zh-cn';
  document.body.innerHTML = '';
});
async function open() {
  wrapper = mount(WebhookPage, { attachTo: document.body, global: { plugins: [i18n] } });
  await flushPromises();
}
async function next() {
  await wrapper.get('[data-test="wizard-next"]').trigger('click');
  await flushPromises();
}
async function reviewNew() {
  await wrapper.get('[data-test="webhook-create"]').trigger('click');
  await wrapper.get('#hook-name').setValue('New hook');
  await next();
  await wrapper.get('#hook-keywords').setValue('BTC ETH');
  await next();
  await wrapper.get('#hook-ips').setValue('192.0.2.1');
  await next();
  await next();
}
it('shows the configured API host for webhook delivery rather than the frontend host', async () => {
  vi.mocked(getWebhooks).mockResolvedValue([
    { id: 1, name: 'Active hook', description: '', keywords: '', allowedIps: '', status: 'ACTIVE', publicId: 'test-public-id' },
  ]);
  vi.mocked(webhookAvailable).mockResolvedValue(true);
  const w = mount(WebhookPage, { global: { plugins: [i18n] } });
  await flushPromises();
  expect(w.text()).toContain('https://api.example.test/api/webhooks/receive/test-public-id');
  w.unmount();
});
it('keeps drafts accessible but disables activation when encryption is not configured', async () => {
  vi.mocked(getWebhooks).mockResolvedValue([
    { id: 1, name: 'Saved draft', description: '', keywords: 'BTC', allowedIps: '', status: 'DRAFT', publicId: 'test-public-id' },
  ]);
  vi.mocked(webhookAvailable).mockResolvedValue(false);
  const w = mount(WebhookPage, { global: { plugins: [i18n] } });
  await flushPromises();
  expect(w.text()).toContain('Saved draft');
  expect(w.get('[data-test="webhook-activate"]').attributes('disabled')).toBeDefined();
  w.unmount();
});
it('gates the name and preserves keywords and IP restrictions when moving back', async () => {
  await open();
  await wrapper.get('[data-test="webhook-create"]').trigger('click');
  await next();
  expect(wrapper.find('#hook-name').exists()).toBe(true);
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  await wrapper.get('#hook-name').setValue('New hook');
  await next();
  expect(wrapper.find('#hook-ips').exists()).toBe(false);
  await wrapper.get('#hook-keywords').setValue('BTC ETH');
  await next();
  await wrapper.get('#hook-ips').setValue('192.0.2.1');
  await wrapper.get('[data-test="wizard-back"]').trigger('click');
  expect((wrapper.get('#hook-keywords').element as HTMLInputElement).value).toBe('BTC ETH');
  await next();
  expect((wrapper.get('#hook-ips').element as HTMLInputElement).value).toBe('192.0.2.1');
  await next();
  await next();
  expect(wrapper.get('[data-test="wizard-review"]').text()).toContain('192.0.2.1');
  expect(createWebhook).not.toHaveBeenCalled();
});
it('saves a draft only at confirmation even if activation is unavailable', async () => {
  vi.mocked(webhookAvailable).mockResolvedValue(false);
  await open();
  await reviewNew();
  expect(createWebhook).not.toHaveBeenCalled();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createWebhook).toHaveBeenCalledWith({ name: 'New hook', description: '', keywords: 'BTC ETH', allowedIps: '192.0.2.1' });
  expect(activateWebhook).not.toHaveBeenCalled();
  expect(wrapper.find('[data-test="webhook-saved"]').exists()).toBe(true);
});
it('blocks invalid IPs at security, retains input, and saves normalized IPv6 after correction', async () => {
  await open();
  await wrapper.get('[data-test="webhook-create"]').trigger('click');
  await wrapper.get('#hook-name').setValue('IPv6 hook');
  await next();
  await next();
  await wrapper.get('#hook-ips').setValue('192.0.2.0/24');
  await next();
  expect((wrapper.get('#hook-ips').element as HTMLTextAreaElement).value).toBe('192.0.2.0/24');
  expect(wrapper.get('[role="alert"]').text()).toBe(i18n.global.t('wizard.invalidIps'));
  expect(createWebhook).not.toHaveBeenCalled();
  await wrapper.get('#hook-ips').setValue('2001:DB8::1\n192.0.2.1');
  await next();
  await next();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createWebhook).toHaveBeenCalledWith(expect.objectContaining({ allowedIps: '2001:db8:0:0:0:0:0:1 192.0.2.1' }));
});
it('allows saving an unrestricted webhook with no IPs', async () => {
  await open();
  await reviewNew();
  await wrapper.get('[data-test="wizard-back"]').trigger('click');
  await wrapper.get('[data-test="wizard-back"]').trigger('click');
  await wrapper.get('#hook-ips').setValue('');
  await next();
  await next();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(createWebhook).toHaveBeenCalledWith(expect.objectContaining({ allowedIps: '' }));
});
it('keeps review after a failed save for retry but does not repeat a successful write on list failure', async () => {
  vi.mocked(createWebhook).mockRejectedValueOnce(new Error('offline')).mockResolvedValueOnce(2);
  await open();
  await reviewNew();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.get('[data-test="wizard-review"]').text()).toContain('New hook');
  expect(wrapper.find('[data-test="webhook-saved"]').exists()).toBe(false);
  vi.mocked(getWebhooks).mockRejectedValueOnce(new Error('list offline')).mockResolvedValue([]);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.find('[data-test="webhook-saved"]').exists()).toBe(true);
  expect(wrapper.find('form').exists()).toBe(false);
  await wrapper.get('[data-test="webhook-refresh"]').trigger('click');
  await flushPromises();
  expect(createWebhook).toHaveBeenCalledTimes(2);
});
it('prefills editing and updates rather than creating another rule', async () => {
  vi.mocked(getWebhooks).mockResolvedValue([draftRule]);
  await open();
  await wrapper.get('[data-test="webhook-edit"]').trigger('click');
  expect((wrapper.get('#hook-name').element as HTMLInputElement).value).toBe('Saved draft');
  await next();
  expect((wrapper.get('#hook-keywords').element as HTMLInputElement).value).toBe('BTC ETH');
  await next();
  await next();
  await next();
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(saveWebhook).toHaveBeenCalledWith(1, {
    name: 'Saved draft',
    description: 'Signals',
    keywords: 'BTC ETH',
    allowedIps: '192.0.2.1',
  });
  expect(createWebhook).not.toHaveBeenCalled();
});
it.each(['zh-cn', 'zh-tw', 'en-us'] as const)(
  'reveals credentials after confirmation and discards the key on dismissal in %s',
  async (locale) => {
    i18n.global.locale.value = locale;
    vi.mocked(getWebhooks).mockResolvedValue([draftRule]);
    vi.mocked(activateWebhook).mockResolvedValue({ publicId: 'test-public-id', signingKey: 'one-time-test-key' });
    await open();
    await wrapper.get('[data-test="webhook-activate"]').trigger('click');
    await flushPromises();
    expect(activateWebhook).not.toHaveBeenCalled();
    const confirm = document.querySelector('.nut-dialog__footer-ok') as HTMLElement;
    expect(confirm).not.toBeNull();
    confirm.click();
    await flushPromises();
    expect(activateWebhook).toHaveBeenCalledWith(1);
    expect((wrapper.get('[data-test="webhook-signing-key"]').element as HTMLInputElement).value).toBe('one-time-test-key');
    await wrapper.get('[data-test="webhook-dismiss-credentials"]').trigger('click');
    expect(wrapper.find('[data-test="webhook-signing-key"]').exists()).toBe(false);
    await wrapper.get('[data-test="webhook-edit"]').trigger('click');
    expect(wrapper.text()).not.toContain('one-time-test-key');
  },
);

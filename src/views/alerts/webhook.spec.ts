import { flushPromises, mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import WebhookPage from './webhook.vue';
import { getWebhooks, webhookAvailable } from '@/api/webhooks';
vi.mock('@/api/webhooks', () => ({
  getWebhooks: vi.fn(),
  webhookAvailable: vi.fn(),
  createWebhook: vi.fn(),
  saveWebhook: vi.fn(),
  activateWebhook: vi.fn(),
  revokeWebhook: vi.fn(),
}));
vi.mock('@/config/runtime', () => ({ runtimeConfig: { apiBaseUrl: 'https://api.example.test/api' } }));
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

import { flushPromises, mount } from '@vue/test-utils';
import { expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import Sheet from './WebhookReminderSheet.vue';
import * as api from '@/api/webhookReminderDestinations';

vi.mock('@/api/webhookReminderDestinations', () => ({
  webhookProviders: ['DINGTALK', 'FEISHU', 'SLACK', 'DISCORD'],
  getWebhookDestinations: vi.fn(),
  createWebhookDestination: vi.fn(),
  updateWebhookDestination: vi.fn(),
  deleteWebhookDestination: vi.fn(),
  testWebhookDestination: vi.fn(),
}));

it('shows platform help, sends only relevant credentials and manages each destination', async () => {
  i18n.global.locale.value = 'en-us';
  const item: api.WebhookDestination = {
    id: 42,
    name: 'Ops',
    provider: 'SLACK',
    enabled: false,
    maskedUrl: 'https://hooks.slack.com/…',
  };
  vi.mocked(api.getWebhookDestinations)
    .mockResolvedValueOnce({ available: true, items: [] })
    .mockResolvedValue({ available: true, items: [item] });
  const view = mount(Sheet, { global: { plugins: [i18n] } });
  const click = (name: string) =>
    view
      .findAll('button')
      .find((button) => button.text() === name)!
      .trigger('click');
  try {
    await flushPromises();
    await click('Add destination');
    expect(view.find('input[type="password"]').exists()).toBe(true);
    await view.get('input[type="password"]').setValue('not-for-slack');
    await view.get('select').setValue('SLACK');
    expect(view.text()).toContain('Incoming Webhooks');
    expect(view.find('input[type="password"]').exists()).toBe(false);
    await view.get('input[maxlength="80"]').setValue('Ops');
    await view.get('input[type="url"]').setValue('https://hooks.slack.com/services/T/B/X');
    await view.get('form').trigger('submit');
    await flushPromises();
    expect(api.createWebhookDestination).toHaveBeenCalledWith({
      provider: 'SLACK',
      name: 'Ops',
      url: 'https://hooks.slack.com/services/T/B/X',
    });
    expect(view.text()).toContain(item.maskedUrl);
    await click('Send test');
    await flushPromises();
    expect(api.testWebhookDestination).toHaveBeenCalledWith(42);
    await click('Enable');
    await flushPromises();
    expect(api.updateWebhookDestination).toHaveBeenCalledWith(42, { enabled: true });
    await click('Delete');
    expect(api.deleteWebhookDestination).not.toHaveBeenCalled();
    await click('Delete');
    await flushPromises();
    expect(api.deleteWebhookDestination).toHaveBeenCalledWith(42);
  } finally {
    view.unmount();
    vi.resetAllMocks();
  }
});

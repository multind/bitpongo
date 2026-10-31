import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import Indicators from './indicators.vue';
const api = vi.hoisted(() => ({ getFearGreed: vi.fn() }));
vi.mock('@/api/indicators', () => api);
let wrapper: ReturnType<typeof mount> | undefined;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});
it('shows stale history with attribution instead of presenting it as a current signal', async () => {
  api.getFearGreed.mockResolvedValue({
    points: [{ value: 40, classification: 'Fear', observedAt: '2026-10-02T00:00:00Z' }],
    fetchedAt: '2026-10-04T00:00:00Z',
    stale: true,
    sourceUrl: 'https://alternative.me/crypto/fear-and-greed-index/',
  });
  i18n.global.locale.value = 'en-us';
  wrapper = mount(Indicators, { global: { plugins: [i18n] } });
  await flushPromises();
  expect(wrapper.text()).toContain('40');
  expect(wrapper.get('[role="meter"]').attributes('aria-valuenow')).toBe('40');
  expect(wrapper.get('[role="status"]').text()).toContain('outdated');
  expect(wrapper.get('.source').text()).toBe('Alternative.me');
  expect(wrapper.find('a').exists()).toBe(false);
});
it('shows an explicit error without an invented zero index', async () => {
  api.getFearGreed.mockRejectedValue(new Error('offline'));
  i18n.global.locale.value = 'en-us';
  wrapper = mount(Indicators, { global: { plugins: [i18n] } });
  await flushPromises();
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  expect(wrapper.find('[data-test="index-value"]').exists()).toBe(false);
});
it('does not invent a zero when the provider returns no points', async () => {
  api.getFearGreed.mockResolvedValue({
    points: [],
    fetchedAt: '2026-10-20T00:00:00Z',
    stale: false,
    sourceUrl: 'https://alternative.me/crypto/fear-and-greed-index/',
  });
  wrapper = mount(Indicators, { global: { plugins: [i18n] } });
  await flushPromises();
  expect(wrapper.find('[role="meter"]').exists()).toBe(false);
  expect(wrapper.get('[data-test="index-empty"]').text()).toBeTruthy();
});

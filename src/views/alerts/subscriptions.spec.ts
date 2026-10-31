import { mount, flushPromises } from '@vue/test-utils';
import { afterEach, expect, it, vi } from 'vitest';
import { createRouter, createMemoryHistory } from 'vue-router';
import { i18n } from '@/i18n';
import Subscriptions from './subscriptions.vue';
const api = vi.hoisted(() => ({
  getStrategySubscription: vi.fn(),
  saveStrategySubscription: vi.fn(),
  deleteStrategySubscription: vi.fn(),
}));
vi.mock('@/api/subscriptions', () => api);
let wrapper: ReturnType<typeof mount> | undefined;
afterEach(() => {
  wrapper?.unmount();
  vi.resetAllMocks();
});

it('keeps threshold fields together and exposes notification settings without saving', async () => {
  api.getStrategySubscription.mockResolvedValue(null);
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts/subscriptions');
  wrapper = mount(Subscriptions, { global: { plugins: [i18n, router] } });
  await flushPromises();
  expect(wrapper.find('a[href="/member/notification-methods"]').exists()).toBe(true);
  expect(wrapper.get('fieldset').findAll('input[type="number"]')).toHaveLength(2);
  expect(api.saveStrategySubscription).not.toHaveBeenCalled();
});
it('shows persisted subscription and retains its status on save failure', async () => {
  api.getStrategySubscription.mockResolvedValue({ enabled: true, fearThreshold: 25, greedThreshold: 75 });
  api.saveStrategySubscription.mockRejectedValue(new Error('offline'));
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts/subscriptions');
  wrapper = mount(Subscriptions, { global: { plugins: [i18n, router] } });
  await flushPromises();
  expect(wrapper.get('[data-test="subscription-status"]').text()).toBe('Active');
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  expect(wrapper.get('[data-test="subscription-status"]').text()).toBe('Active');
  expect(wrapper.find('a[href="/create"]').exists()).toBe(true);
});

it('saves edited thresholds and keeps invalid ranges from reaching the API', async () => {
  api.getStrategySubscription.mockResolvedValue({ enabled: true, fearThreshold: 25, greedThreshold: 75 });
  api.saveStrategySubscription.mockResolvedValue(undefined);
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/:pathMatch(.*)*', component: { template: '<div/>' } }],
  });
  await router.push('/alerts/subscriptions');
  wrapper = mount(Subscriptions, { global: { plugins: [i18n, router] } });
  await flushPromises();
  const inputs = wrapper.findAll('input[type="number"]');
  await inputs[0].setValue(80);
  await inputs[1].setValue(70);
  await wrapper.get('form').trigger('submit');
  expect(api.saveStrategySubscription).not.toHaveBeenCalled();
  expect(wrapper.find('[role="alert"]').exists()).toBe(true);
  await inputs[0].setValue(20);
  await wrapper.get('form').trigger('submit');
  await flushPromises();
  expect(api.saveStrategySubscription).toHaveBeenCalledExactlyOnceWith({ enabled: true, fearThreshold: 20, greedThreshold: 70 });
});

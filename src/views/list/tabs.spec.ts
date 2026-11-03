import { flushPromises, mount } from '@vue/test-utils';
import { createMemoryHistory, createRouter, useRoute, useRouter } from 'vue-router';
import { computed, onMounted } from 'vue';
import { describe, expect, it, vi } from 'vitest';
import NutTabs from '@nutui/nutui/dist/packages/tabs/Tabs';
import NutTabPane from '@nutui/nutui/dist/packages/tabpane/TabPane';
import { i18n } from '@/i18n';
import ListPage from './index.vue';

vi.stubGlobal('useRouter', useRouter);
vi.stubGlobal('useRoute', useRoute);
vi.stubGlobal('computed', computed);
vi.stubGlobal('onMounted', onMounted);

vi.mock('@/api', () => ({ planPage: vi.fn().mockResolvedValue({ items: [], hasMore: false, activeTotal: 0 }) }));
vi.mock('@/api/fngStrategies', () => ({
  fngStrategyPage: vi.fn().mockResolvedValue({ items: [], hasMore: false, activeTotal: 0 }),
  deleteFngStrategy: vi.fn(),
  setFngStrategyEnabled: vi.fn(),
}));
vi.mock('@/store/modules/user', () => ({ useUserStore: () => ({ getUserInfo: {} }) }));

describe('list tabs', () => {
  it('limits the inactive pane height and restores the running tab after returning', async () => {
    const router = createRouter({
      history: createMemoryHistory(),
      routes: [
        { path: '/list', component: ListPage },
        { path: '/detail', component: { template: '<div />' } },
      ],
    });
    await router.push('/list');
    await router.isReady();
    const wrapper = mount(ListPage, {
      global: {
        plugins: [router, i18n],
        components: { NutTabs, NutTabPane },
        stubs: {
          PlanCard: true,
          SharePoster: true,
          PageIcon: true,
          'nut-popup': true,
          'nut-cell-group': true,
          'nut-cell': true,
          'nut-empty': true,
          'nut-row': true,
          'nut-col': true,
        },
      },
    });
    await flushPromises();
    const tabs = wrapper.getComponent(NutTabs);
    expect(tabs.props('autoHeight')).toBe(true);
    await tabs.vm.$emit('update:modelValue', '2');
    await flushPromises();
    expect(router.currentRoute.value.query.tab).toBe('running');
    await router.push('/detail');
    await router.back();
    await new Promise((resolve) => setTimeout(resolve, 10));
    wrapper.unmount();
    const returned = mount(ListPage, {
      global: {
        plugins: [router, i18n],
        components: { NutTabs, NutTabPane },
        stubs: {
          PlanCard: true,
          SharePoster: true,
          PageIcon: true,
          'nut-popup': true,
          'nut-cell-group': true,
          'nut-cell': true,
          'nut-empty': true,
          'nut-row': true,
          'nut-col': true,
        },
      },
    });
    await flushPromises();
    expect(returned.getComponent(NutTabs).props('modelValue')).toBe('2');
  });
});

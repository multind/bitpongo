import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createPinia } from 'pinia';
import { createMemoryHistory, createRouter } from 'vue-router';
import { i18n } from '@/i18n';
import PresetsView from './index.vue';
import { listPresets, togglePresetFavorite, type PresetItem } from '@/api/presets';

vi.mock('@/api/presets', () => ({
  listPresets: vi.fn(),
  togglePresetFavorite: vi.fn(),
}));
vi.mock('@nutui/nutui', () => ({ showToast: { success: vi.fn(), fail: vi.fn() } }));

const fng: PresetItem = {
  key: 'fng:1',
  type: 'FNG',
  name: 'F&G Strategy Alert',
  author: 'Bitpongo',
  official: true,
  recommended: true,
  followers: 0,
  favorite: false,
  totalRevenue: null,
  totalRatio: null,
  exchange: 'binance',
  symbols: ['BTC'],
  runtimeDays: null,
  sparkline: [],
  params: { fearThreshold: 25, greedThreshold: 75 },
};
const dca: PresetItem = {
  key: 'dca:1',
  type: 'DCA',
  name: 'BTC DCA',
  author: 'Test',
  official: false,
  recommended: false,
  followers: 2,
  favorite: false,
  totalRevenue: '1801.9',
  totalRatio: '180.19',
  exchange: 'binance',
  symbols: ['BTC'],
  runtimeDays: 128,
  sparkline: ['10', '50', '180.19'],
  params: { name: 'BTC DCA', frequency: 'daily', cron: '0 0 8 * * ?', coins: [] },
};
let wrapper: ReturnType<typeof mount> | null = null;

async function mountView() {
  i18n.global.locale.value = 'en-us';
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/presets', component: { template: '<div />' } },
      { path: '/create', component: { template: '<div />' } },
      { path: '/fng/create', component: { template: '<div />' } },
    ],
  });
  await router.push('/presets');
  wrapper = mount(PresetsView, { global: { plugins: [i18n, createPinia(), router] } });
  await flushPromises();
  return { wrapper, router };
}

beforeEach(() => {
  vi.mocked(listPresets).mockResolvedValue({ items: [dca, fng], page: 0, size: 50, total: 2, hasMore: false });
  vi.mocked(togglePresetFavorite).mockResolvedValue({ favorite: true, followers: 1 });
});

afterEach(() => {
  wrapper?.unmount();
  wrapper = null;
  vi.resetAllMocks();
});

describe('preset strategies', () => {
  it('renders cards and toggles favorites', async () => {
    const view = await mountView();
    expect(view.wrapper.text()).toContain('F&G Strategy Alert');
    expect(view.wrapper.text()).toContain('BTC DCA');
    expect(view.wrapper.text()).toContain('128D');
    await view.wrapper.get('[data-test="preset-favorite-fng:1"]').trigger('click');
    expect(togglePresetFavorite).toHaveBeenCalledWith('fng:1');
    expect(view.wrapper.text()).toContain('Favorited');
  });

  it('opens the F&G create page with the preset key', async () => {
    const view = await mountView();
    await view.wrapper.get('[data-test="preset-fng:1"]').trigger('click');
    await view.wrapper.get('[data-test="presets-use-confirm"]').trigger('click');
    await flushPromises();
    expect(view.router.currentRoute.value.path).toBe('/fng/create');
    expect(view.router.currentRoute.value.query.presetKey).toBe('fng:1');
  });

  it('opens the create page with the DCA preset key', async () => {
    const view = await mountView();
    await view.wrapper.get('[data-test="preset-dca:1"]').trigger('click');
    await view.wrapper.get('[data-test="presets-use-confirm"]').trigger('click');
    await flushPromises();
    expect(view.router.currentRoute.value.path).toBe('/create');
    expect(view.router.currentRoute.value.query.presetKey).toBe('dca:1');
  });

  it('applies list filters', async () => {
    const view = await mountView();
    await view.wrapper.get('[data-test="presets-filter"]').trigger('click');
    const highest = view.wrapper.findAll('button').find((button) => button.text() === 'Highest return');
    await highest!.trigger('click');
    await view.wrapper.get('[data-test="presets-filter-confirm"]').trigger('click');
    await flushPromises();
    expect(vi.mocked(listPresets).mock.calls.at(-1)?.[0]).toMatchObject({ sort: 'return' });
  });
});

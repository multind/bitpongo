import { mount } from '@vue/test-utils';
import { i18n } from '@/i18n';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import ExchangeDetails from './details.vue';

const mocks = vi.hoisted(() => ({
  exchangeDetails: vi.fn(),
}));

vi.mock('vue-router', () => ({
  useRoute: () => ({ params: { id: '7' } }),
}));

vi.mock('@/api', () => ({
  checkExchange: vi.fn(),
  exchangeDetails: mocks.exchangeDetails,
}));

vi.mock('@nutui/nutui', () => ({
  showToast: { loading: vi.fn(() => ({ hide: vi.fn() })) },
}));

function mountDetails() {
  return mount(ExchangeDetails, {
    global: {
      plugins: [i18n],
      stubs: {
        'nut-row': { template: '<div><slot /></div>' },
        'nut-col': { template: '<div><slot /></div>' },
        'nut-cell-group': { template: '<div><slot /></div>' },
        'nut-cell': { template: '<div><slot name="desc" /></div>' },
        'nut-tag': { template: '<span class="nut-tag"><slot /></span>' },
        'nut-sticky': { template: '<div><slot /></div>' },
        'nut-button': { template: '<button><slot name="icon" /><slot /></button>' },
        Refresh: true,
      },
    },
  });
}

describe('member exchange details', () => {
  beforeEach(() => {
    mocks.exchangeDetails.mockResolvedValue({
      id: 7,
      name: 'Primary',
      exchange: 'binance',
      access_key: 'access',
      secret_key: 'secret',
      password: '',
      status: 'active',
      created_at: '2026-08-22T12:00:00Z',
    });
  });

  it('renders the status label without overriding the inherited application font', () => {
    const wrapper = mountDetails();
    const statusLabel = wrapper.get('.nut-tag > span').element as HTMLElement;

    expect(statusLabel.style.fontFamily).toBe('');
  });
});

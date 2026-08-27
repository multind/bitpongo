import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import TimeZoneSelect from './TimeZoneSelect.vue';

describe('TimeZoneSelect', () => {
  afterEach(() => vi.restoreAllMocks());

  it('searches localized IANA labels and emits the exact identifier', async () => {
    vi.spyOn(Intl as typeof Intl & { supportedValuesOf: () => string[] }, 'supportedValuesOf').mockReturnValue([
      'Asia/Shanghai',
      'America/New_York',
      'Etc/GMT+8',
    ]);
    const wrapper = mount(TimeZoneSelect, {
      props: { modelValue: 'Asia/Shanghai' },
      global: { plugins: [i18n] },
    });

    await wrapper.get('[data-test="timezone-search"]').setValue('New York');
    const option = wrapper.get('option[value="America/New_York"]');
    expect(option.text()).toContain('America/New_York');
    expect(wrapper.find('option[value="Etc/GMT+8"]').exists()).toBe(false);

    await wrapper.get('[data-test="timezone-select"]').setValue('America/New_York');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['America/New_York']);
  });
});

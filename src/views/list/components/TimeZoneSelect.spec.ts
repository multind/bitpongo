import { mount } from '@vue/test-utils';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { i18n } from '@/i18n';
import TimeZoneSelect from './TimeZoneSelect.vue';

describe('TimeZoneSelect', () => {
  afterEach(() => vi.restoreAllMocks());

  it('searches in the bottom sheet and commits the exact identifier only on confirmation', async () => {
    vi.spyOn(Intl as typeof Intl & { supportedValuesOf: () => string[] }, 'supportedValuesOf').mockReturnValue([
      'Asia/Shanghai',
      'America/New_York',
      'Etc/GMT+8',
    ]);
    const wrapper = mount(TimeZoneSelect, {
      props: { modelValue: 'Asia/Shanghai' },
      global: { plugins: [i18n] },
    });

    await wrapper.get('[data-test="timezone-select"]').trigger('click');
    await wrapper.get('[data-test="timezone-search"]').setValue('New York');
    const option = wrapper.get('input[value="America/New_York"]');
    expect(option.element.closest('label')?.textContent).toContain('America/New_York');
    expect(wrapper.find('input[value="Etc/GMT+8"]').exists()).toBe(false);

    await option.setValue(true);
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    await wrapper.get('[data-test="timezone-confirm"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')?.at(-1)).toEqual(['America/New_York']);
  });

  it('discards a selection on cancel and resets search when reopened', async () => {
    const wrapper = mount(TimeZoneSelect, { props: { modelValue: 'Asia/Shanghai' }, global: { plugins: [i18n] } });
    await wrapper.get('[data-test="timezone-select"]').trigger('click');
    await wrapper.get('[data-test="timezone-search"]').setValue('Tokyo');
    await wrapper.get('input[value="Asia/Tokyo"]').setValue(true);
    await wrapper.get('[data-test="timezone-cancel"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    await wrapper.get('[data-test="timezone-select"]').trigger('click');
    expect(wrapper.get('[data-test="timezone-search"]').element).toHaveProperty('value', '');
    expect(wrapper.get('input[value="Asia/Shanghai"]').element).toHaveProperty('checked', true);
  });

  it('blocks confirmation with no matching results and cannot open when disabled', async () => {
    const wrapper = mount(TimeZoneSelect, { props: { modelValue: 'Asia/Shanghai' }, global: { plugins: [i18n] } });
    await wrapper.get('[data-test="timezone-select"]').trigger('click');
    await wrapper.get('[data-test="timezone-search"]').setValue('no-such-timezone');
    expect(wrapper.get('[data-test="timezone-confirm"]').attributes('disabled')).toBeDefined();
    await wrapper.get('[data-test="timezone-confirm"]').trigger('click');
    expect(wrapper.emitted('update:modelValue')).toBeUndefined();
    await wrapper.get('[data-test="timezone-cancel"]').trigger('click');
    await wrapper.setProps({ disabled: true });
    await wrapper.get('[data-test="timezone-select"]').trigger('click');
    expect(wrapper.get('[data-test="timezone-select"]').attributes('aria-expanded')).toBe('false');
  });
});

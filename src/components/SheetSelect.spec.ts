import { mount } from '@vue/test-utils';
import { afterEach, expect, it } from 'vitest';
import { i18n } from '@/i18n';
import SheetSelect from './SheetSelect.vue';
let wrapper: ReturnType<typeof mount>;
afterEach(() => wrapper?.unmount());
const options = [
  { value: 'BTCUSDT', label: 'BTC / USDT' },
  { value: 'ETHUSDT', label: 'ETH / USDT' },
];
function render() {
  wrapper = mount(SheetSelect, {
    props: { modelValue: 'BTCUSDT', label: 'Trading pair', options, searchable: true },
    global: { plugins: [i18n] },
  });
  return wrapper;
}
it('searches pairs and emits only after explicit confirmation', async () => {
  const view = render();
  await view.get('button[aria-haspopup]').trigger('click');
  await view.get('input[type=search]').setValue('eth');
  expect(view.find('input[value=BTCUSDT]').exists()).toBe(false);
  await view.get('input[value=ETHUSDT]').setValue(true);
  expect(view.emitted('update:modelValue')).toBeUndefined();
  await view.get('[data-test=sheet-confirm]').trigger('click');
  expect(view.emitted('update:modelValue')).toEqual([['ETHUSDT']]);
});
it('discards canceled changes and restores the persisted value on reopening', async () => {
  const view = render();
  await view.get('button[aria-haspopup]').trigger('click');
  await view.get('input[value=ETHUSDT]').setValue(true);
  await view.get('[data-test=sheet-cancel]').trigger('click');
  await view.get('button[aria-haspopup]').trigger('click');
  expect(view.get('input[value=BTCUSDT]').element).toHaveProperty('checked', true);
  expect(view.emitted('update:modelValue')).toBeUndefined();
});
it('cannot commit missing options or open a disabled control', async () => {
  const view = render();
  await view.get('button[aria-haspopup]').trigger('click');
  await view.get('input[type=search]').setValue('nothing');
  expect(view.get('[data-test=sheet-confirm]').attributes('disabled')).toBeDefined();
  await view.get('[data-test=sheet-cancel]').trigger('click');
  await view.setProps({ disabled: true });
  expect(view.get('button[aria-haspopup]').attributes('aria-disabled')).toBe('true');
  expect(view.get('button[aria-haspopup]').attributes('disabled')).toBeUndefined();
  await view.get('button[aria-haspopup]').trigger('click');
  expect(view.get('button[aria-haspopup]').attributes('aria-expanded')).toBe('false');
});

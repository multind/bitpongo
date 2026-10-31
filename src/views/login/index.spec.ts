import { mount } from '@vue/test-utils';
import { createPinia } from 'pinia';
import { expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import Login from './index.vue';
import { Form, FormItem, Input, Button, Cell } from '@nutui/nutui';
vi.mock('@/router', () => ({ default: { push: vi.fn() } }));
it('presents the existing email login with a brand header and accessible agreement link', () => {
  const wrapper = mount(Login, {
    global: {
      plugins: [createPinia(), i18n],
      components: { NutForm: Form, NutFormItem: FormItem, NutInput: Input, NutButton: Button, NutCell: Cell },
      stubs: { RouterLink: true },
    },
  });
  expect(wrapper.get('[data-test="auth-brand"]').attributes('alt')).toBe('Bitpongo');
  expect(wrapper.get('input[type="email"]').attributes('placeholder')).toBe(i18n.global.t('login.usernamePlaceholder'));
  expect(wrapper.get('input[type="password"]').attributes('placeholder')).toBe(i18n.global.t('login.passwordPlaceholder'));
  expect(wrapper.get('button[data-test="login-agreement"]').text()).toBeTruthy();
  wrapper.unmount();
});

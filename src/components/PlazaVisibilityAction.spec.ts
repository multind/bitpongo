import { flushPromises, mount } from '@vue/test-utils';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { i18n } from '@/i18n';
import { getPresetVisibility, updatePresetVisibility } from '@/api/presets';
import { showDialog, showToast } from '@nutui/nutui';
import PlazaVisibilityAction from './PlazaVisibilityAction.vue';

vi.mock('@/api/presets', () => ({ getPresetVisibility: vi.fn(), updatePresetVisibility: vi.fn() }));
vi.mock('@nutui/nutui', async (importOriginal) => ({
  ...(await importOriginal<Record<string, unknown>>()),
  showDialog: vi.fn(),
  showToast: { fail: vi.fn() },
}));

let view: ReturnType<typeof mount>;
const action = () => view.get('.plaza-action');
const dialog = () => vi.mocked(showDialog).mock.lastCall![0];

beforeEach(async () => {
  vi.resetAllMocks();
  vi.mocked(getPresetVisibility).mockResolvedValue({ public: false });
  view = mount(PlazaVisibilityAction, {
    props: { type: 'DCA', strategyId: 1 },
    global: { plugins: [i18n] },
  });
  await flushPromises();
});
afterEach(() => view.unmount());

it('uses the same NutUI button as the other strategy actions', () => {
  expect(action().classes()).toContain('nut-button');
});

it('shows existing copy and only changes the action after a successful save', async () => {
  const initial = action().text();
  await action().trigger('click');
  expect(dialog().content).toBe(i18n.global.t('presets.visibilityHint'));
  expect(updatePresetVisibility).not.toHaveBeenCalled();
  vi.mocked(updatePresetVisibility).mockResolvedValueOnce({ public: true });
  await dialog().onOk?.();
  await flushPromises();
  expect(updatePresetVisibility).toHaveBeenLastCalledWith('DCA', 1, true);
  expect(action().text()).not.toBe(initial);
  vi.mocked(updatePresetVisibility).mockResolvedValueOnce({ public: false });
  await action().trigger('click');
  await flushPromises();
  expect(updatePresetVisibility).toHaveBeenLastCalledWith('DCA', 1, false);
  expect(action().text()).toBe(initial);
});

it('keeps the current action if saving fails', async () => {
  const initial = action().text();
  await action().trigger('click');
  vi.mocked(updatePresetVisibility).mockRejectedValueOnce(new Error('offline'));
  await dialog().onOk?.();
  await flushPromises();
  expect(action().text()).toBe(initial);
  expect(showToast.fail).toHaveBeenCalled();
});

it('ignores an old save result after the strategy changes', async () => {
  const initial = action().text();
  let finish!: (result: { public: boolean }) => void;
  vi.mocked(updatePresetVisibility).mockReturnValueOnce(
    new Promise((resolve) => {
      finish = resolve;
    }),
  );
  await action().trigger('click');
  const save = dialog().onOk?.();
  await view.setProps({ type: 'FNG', strategyId: 2 });
  finish({ public: true });
  await save;
  await flushPromises();
  expect(action().text()).toBe(initial);
});

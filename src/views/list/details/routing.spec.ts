import { reactive, nextTick } from 'vue';
import { mount } from '@vue/test-utils';
import { describe, expect, it, vi } from 'vitest';
const state = vi.hoisted(() => ({ route: null as any }));
vi.mock('vue-router', () => ({ useRoute: () => state.route }));
vi.mock('./PlanDetails.vue', () => ({ default: { name: 'PlanDetails', template: '<div>plan</div>' } }));
import View from './index.vue';
describe('mounted plan navigation', () => {
  it('replaces plan state when switching ids and supports legacy planId', async () => {
    state.route = reactive({ query: { planId: '12' } });
    const view = mount(View);
    const first = view.getComponent({ name: 'PlanDetails' }).vm;
    state.route.query = { id: '13', tab: 'executions' };
    await nextTick();
    expect(view.getComponent({ name: 'PlanDetails' }).vm).not.toBe(first);
  });
});

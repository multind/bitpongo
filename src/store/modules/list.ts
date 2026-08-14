import { getExchangeList } from '@/api';
import type { Exchange } from '@/views/list/types/exchange';

export const useListStore = defineStore('list', {
  state: () => ({
    dataList: [] as Exchange[],
    isLoading: false,
  }),
  actions: {
    async fetchList() {
      this.isLoading = true;
      try {
        this.dataList = await getExchangeList();
      } catch (error) {
        console.error('获取列表失败:', error);
      } finally {
        this.isLoading = false;
      }
    },
    clearList() {
      this.dataList = [];
    },
  },
});

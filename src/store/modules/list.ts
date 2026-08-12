import { getExchangeList } from '@/api';

export const useListStore = defineStore('list', {
  state: () => ({
    dataList: [],
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

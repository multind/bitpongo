<template>
  <nut-row>
    <nut-col span="24">
      <nut-cell title="选择 API" is-link @click="showPopup = true">
        <template #desc>
          <span style="color: black">{{ exchangeDesc }}</span>
        </template>
      </nut-cell>
    </nut-col>
    <nut-popup
      v-model:visible="showPopup"
      position="bottom"
      round
      closeable
      close-icon-position="top-left"
      :style="{ height: '60%', paddingTop: '4%', backgroundColor: '' }"
    >
      <div style="margin-top: 35px"></div>
      <div
        v-for="(item, index) in listData"
        :key="index"
        style="padding: 10px; margin: 10px 20px; border: 1px solid #999; border-radius: 10px"
        @click="exchangeClicked(item)"
      >
        <nut-row type="flex" justify="space-between" flex-wrap="nowrap" style="border: #999">
          <nut-col span="12">
            <text style="font-family: 'Apple SD Gothic Neo', serif; font-size: 14px">{{ item.name }}</text>
          </nut-col>
          <nut-col align="right" span="12">
            <nut-tag
              :color="item.status === 'active' ? 'green' : 'grey'"
              :style="{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center', lineHeight: '20px', fontFamily: 'Arial' }"
            >
              {{ getStatusText(item.status) }}
            </nut-tag>
          </nut-col>
        </nut-row>
        <nut-row type="flex" flex-wrap="nowrap" style="border: #999">
          <nut-col span="12">
            <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
              <text style="font-size: 10px; color: #999">交易所</text>
              <text style="font-size: 13px">{{ getExchangeName(item.exchange) }}</text>
            </nut-space>
          </nut-col>
          <nut-col span="12">
            <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
              <text style="font-size: 10px; color: #999">Api Key</text>
              <text style="font-size: 13px">{{ maskApiKey(item.access_key) }}</text>
            </nut-space>
          </nut-col>
        </nut-row>
      </div>
    </nut-popup>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useListStore } from '@/store/modules/list.ts';
  import type { Strategy } from '@/views/list/types/strategy.ts';
  import { showToast } from '@nutui/nutui';

  interface Props {
    strategy: Strategy;
  }
  interface Emits {
    (e: 'update:strategy', value: Strategy): void;
  }
  const emit = defineEmits<Emits>();
  const props = defineProps<Props>();

  const showPopup = ref(false);
  const exchangeDesc = ref('');
  const listStore = useListStore();
  const listData = ref([]);
  // 获取列表数据
  onMounted(async () => {
    await listStore.fetchList();
    listData.value = listStore.dataList;
  });
  // 获取交易所名称
  function getExchangeName(exchangeId: string): string {
    const exchangeMap: Record<string, string> = {
      binance: 'Binance',
      okx: 'OKX',
      // 可以根据实际需求添加更多交易所
    };
    return exchangeMap[exchangeId] || '未知交易所';
  }

  // 掩码API Key
  function maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    return apiKey.substring(0, 3) + '***';
  }
  const currentItem = ref<any>(null);
  const exchangeClicked = (item: any) => {
    if (item.status !== 'active') {
      showToast.fail('API 状态错误');
      return;
    }
    showPopup.value = false;
    currentItem.value = item;
    console.log(item);
    exchangeDesc.value = currentItem.value.name;
    const updatedStrategy = { ...props.strategy, exchange_id: currentItem.value.id };
    emit('update:strategy', updatedStrategy);
  };

  // 获取状态文本
  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      active: '生 效',
      inactive: '失 效',
      pending: '待审核',
    };
    return statusMap[status] || '未知';
  }
</script>

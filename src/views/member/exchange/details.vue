<template>
  <nut-row v-if="loading" type="flex" justify="center">
    <nut-col span="24">
      <text>加载中...</text>
    </nut-col>
  </nut-row>
  <nut-row v-else-if="error" type="flex" justify="center">
    <nut-col span="24">
      <text style="color: red">{{ error }}</text>
    </nut-col>
  </nut-row>
  <nut-cell-group :span="10">
    <nut-cell title="名称">
      <template #desc>
        <text style="color: #2c3e50">
          {{ currentItem.name }}
        </text>
      </template>
    </nut-cell>
    <nut-cell title="交易所">
      <template #desc>
        <text style="color: #2c3e50">
          {{ getExchangeName(currentItem.exchange) }}
        </text>
      </template>
    </nut-cell>
    <nut-cell title="AccessKey">
      <template #desc>
        <text style="color: #2c3e50">
          {{ currentItem.access_key }}
        </text>
      </template>
    </nut-cell>
    <nut-cell title="SecretKey">
      <template #desc>
        <text style="color: #2c3e50">
          {{ currentItem.secret_key }}
        </text>
      </template>
    </nut-cell>
    <nut-cell v-show="currentItem.exchange === 'okx'" title="Password">
      <template #desc>
        <text style="color: #2c3e50">
          {{ currentItem.password }}
        </text>
      </template>
    </nut-cell>
    <nut-cell title="创建时间">
      <template #desc>
        <text style="color: #2c3e50">
          {{ formatDate(currentItem.created_at) }}
        </text>
      </template>
    </nut-cell>

    <nut-cell title="可用余额">
      <template #desc>
        <text style="color: #2c3e50">
          {{ ff }}
        </text>
      </template>
    </nut-cell>
    <nut-cell title="状态" subTitle="更新时间：2025-12-07">
      <template #desc>
        <nut-tag :color="currentItem.status === 'active' ? 'green' : 'grey'">
          <text
            :style="{
              fontWeight: 'bold',
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '20px',
              fontFamily: 'Arial',
            }"
          >
            {{ getStatusText(currentItem.status) }}
          </text>
        </nut-tag>
      </template>
    </nut-cell>
  </nut-cell-group>

  <nut-sticky bottom="5" position="bottom">
    <nut-row type="flex" justify="center" :gutter="10" style="margin-top: 10px">
      <nut-col :span="22">
        <nut-button size="large" style="background-color: #101010" @click="apiStatusCheck">
          <template #icon>
            <Refresh color="white" />
          </template>
          <text style="color: whitesmoke"> 检 查 </text>
        </nut-button>
      </nut-col>
    </nut-row>
  </nut-sticky>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router';
  import { onMounted, ref } from 'vue';
  import { checkExchange, exchangeDetails } from '@/api';
  import { Refresh } from '@nutui/icons-vue';
  import { showToast } from '@nutui/nutui';
  import type { CheckExchangeData } from '@/views/list/types/exchange';

  const route = useRoute();
  // 获取当前项数据
  const loading = ref(false);
  const ff = ref('0 USDT');
  const error = ref<string | null>(null);
  const currentItem = ref({
    id: null,
    name: '',
    exchange: '',
    access_key: '',
    secret_key: '',
    password: '',
    status: '',
    created_at: '',
  });

  onMounted(async () => {
    const id = route.params.id as string;
    loading.value = true;
    error.value = null;

    try {
      currentItem.value = await exchangeDetails(id);
    } catch (err) {
      console.error('获取详情失败:', err);
      error.value = '获取详情失败';
    } finally {
      loading.value = false;
    }
  });

  // 获取交易所名称
  function getExchangeName(exchangeId: string): string {
    const exchangeMap: Record<string, string> = {
      binance: 'Binance',
      okx: 'OKX',
    };
    return exchangeMap[exchangeId] || '未知交易所';
  }

  // 获取状态文本
  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      active: '生 效',
      inactive: '失 效',
      pending: '待审核',
    };
    return statusMap[status] || '未知';
  }

  // 格式化日期
  function formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  const apiStatusCheck = async () => {
    const toast = showToast.loading('加载中...', {
      'cover-color': 'rgba(0, 0, 0, 0.5)',
      duration: 0,
      cover: true,
    });

    try {
      const result = await checkExchange(<CheckExchangeData>{
        exchange: currentItem.value.exchange,
        id: currentItem.value.id,
      });
      console.log(result);
      if (result) {
        currentItem.value.status = 'active';
        ff.value = result.free + ' USDT';
      } else {
        currentItem.value.status = 'inactive';
      }
    } finally {
      // 接口调用完成后隐藏toast
      toast.hide();
    }
  };
</script>

<style scoped lang="scss"></style>

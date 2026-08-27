<template>
  <nut-row v-if="loading" type="flex" justify="center">
    <nut-col span="24">
      <span>{{ t('common.loading') }}</span>
    </nut-col>
  </nut-row>
  <nut-row v-else-if="error" type="flex" justify="center">
    <nut-col span="24">
      <span style="color: red">{{ error }}</span>
    </nut-col>
  </nut-row>
  <nut-cell-group v-else data-test="exchange-details" :span="10">
    <nut-cell :title="t('exchange.name')">
      <template #desc>
        <span style="color: #2c3e50">
          {{ currentItem.name }}
        </span>
      </template>
    </nut-cell>
    <nut-cell :title="t('common.exchange')">
      <template #desc>
        <span style="color: #2c3e50">
          {{ getExchangeName(currentItem.exchange) }}
        </span>
      </template>
    </nut-cell>
    <nut-cell title="AccessKey">
      <template #desc>
        <span style="color: #2c3e50">
          {{ currentItem.access_key }}
        </span>
      </template>
    </nut-cell>
    <nut-cell title="SecretKey">
      <template #desc>
        <span style="color: #2c3e50">
          {{ currentItem.secret_key }}
        </span>
      </template>
    </nut-cell>
    <nut-cell v-show="currentItem.exchange === 'okx'" title="Password">
      <template #desc>
        <span style="color: #2c3e50">
          {{ currentItem.password }}
        </span>
      </template>
    </nut-cell>
    <nut-cell :title="t('common.createTime')">
      <template #desc>
        <span data-test="exchange-created-at" style="color: #2c3e50">
          {{ formatDate(currentItem.created_at) }}
        </span>
      </template>
    </nut-cell>

    <nut-cell :title="t('exchange.availableBalance')">
      <template #desc>
        <span style="color: #2c3e50">
          {{ ff }}
        </span>
      </template>
    </nut-cell>
    <nut-cell :title="t('common.status')">
      <template #desc>
        <nut-tag :color="currentItem.status === 'active' ? 'green' : 'grey'">
          <span
            :style="{
              fontWeight: 'bold',
              fontSize: '12px',
              textAlign: 'center',
              lineHeight: '20px',
            }"
          >
            {{ getStatusText(currentItem.status) }}
          </span>
        </nut-tag>
      </template>
    </nut-cell>
  </nut-cell-group>

  <nut-sticky bottom="5" position="bottom">
    <nut-row type="flex" justify="center" :gutter="10" style="margin-top: 10px">
      <nut-col :span="22">
        <nut-button size="large" style="background-color: #101010" @click="apiStatusCheck">
          <span style="color: whitesmoke"> {{ t('common.check') }} </span>
        </nut-button>
      </nut-col>
    </nut-row>
  </nut-sticky>
</template>

<script setup lang="ts">
  import { useRoute } from 'vue-router';
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { checkExchange, exchangeDetails } from '@/api';
  import { showToast } from '@nutui/nutui';
  import type { CheckExchangeData } from '@/views/list/types/exchange';
  import { formatInstant } from '@/utils/timeUtils';

  const { t } = useI18n();
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
      error.value = t('common.fetchDetailsFailed');
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
    return exchangeMap[exchangeId] || t('common.exchangeName');
  }

  // 获取状态文本
  function getStatusText(status: string): string {
    const statusMap: Record<string, string> = {
      active: t('common.active'),
      inactive: t('common.inactive'),
      pending: t('common.pending'),
    };
    return statusMap[status] || t('common.unknown');
  }

  // 格式化日期
  function formatDate(dateString: string): string {
    return dateString ? formatInstant(dateString) : '';
  }

  const apiStatusCheck = async () => {
    const toast = showToast.loading(t('common.loading'), {
      'cover-color': 'rgba(0, 0, 0, 0.5)',
      duration: 0,
      cover: true,
    });

    try {
      if (currentItem.value.id === null) {
        toast.hide();
        return;
      }
      const result = await checkExchange(<CheckExchangeData>{
        exchange: currentItem.value.exchange,
        id: currentItem.value.id,
      });
      console.log(result);
      toast.hide();
      if (result) {
        currentItem.value.status = 'active';
        ff.value = result.free + ' USDT';
        showToast.success(t('common.querySuccess'));
      } else {
        currentItem.value.status = 'inactive';
        showToast.fail(t('common.queryFailed'));
      }
    } catch (error) {
      toast.hide();
      currentItem.value.status = 'inactive';
      ff.value = '-';
      showToast.fail(error instanceof Error ? error.message : t('common.queryFailed'));
    }
  };
</script>

<style scoped lang="scss">
  ::v-deep(.nut-cell__title) {
    box-sizing: border-box;
    flex: 0 0 6.5rem;
    min-width: 0;
    padding-right: 0.75rem;
  }

  ::v-deep(.nut-cell__value) {
    flex: 1 1 0;
    min-width: 0;
    max-width: calc(100% - 6.5rem);
    overflow: visible;
    text-align: right;
    overflow-wrap: anywhere;
    white-space: normal;
  }

  ::v-deep(.nut-cell__value > span) {
    display: block;
    max-width: 100%;
    word-break: break-all;
    overflow-wrap: anywhere;
    white-space: normal;
  }
</style>

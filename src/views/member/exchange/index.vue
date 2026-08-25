<template>
  <nut-row type="flex" justify="center" flex-wrap="nowrap" style="margin: 10px 0">
    <nut-col span="22">
      <text style="font-size: 12px; color: grey">
        {{ t('exchange.apiIntro') }}
      </text>
    </nut-col>
  </nut-row>

  <!--  <nut-row type="flex" justify="center" flex-wrap="nowrap" style="margin: 20px 0">-->
  <!--    <nut-col span="22">-->
  <!--      <text style="font-size: 13px; color: black; border-bottom: 1px dashed #999"> {{ t('exchange.howTo') }} </text>-->
  <!--    </nut-col>-->
  <!--  </nut-row>-->

  <div
    v-for="(item, index) in listData"
    :key="index"
    style="padding: 5px; margin: 15px; background-color: #f5f5f5; border: 1px solid #c8c8c8; border-radius: 10px"
    @click="
      () => {
        more = true;
        currentItem = item;
      }
    "
  >
    <nut-row type="flex" justify="space-between" flex-wrap="nowrap" style="border: gray">
      <nut-col span="18">
        <text style="font-size: 14px">{{ item.name }}</text>
      </nut-col>
      <nut-col align="right" span="6">
        <MoreX />
      </nut-col>
    </nut-row>
    <nut-row type="flex" flex-wrap="nowrap">
      <nut-col span="12">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 10px; color: grey">{{ t('common.exchange') }}</text>
          <text style="font-size: 13px">{{ getExchangeName(item.exchange) }}</text>
        </nut-space>
      </nut-col>
      <nut-col span="12">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 10px; color: grey">Api Key</text>
          <text style="font-size: 13px">{{ maskApiKey(item.access_key) }}</text>
        </nut-space>
      </nut-col>
    </nut-row>
    <nut-row type="flex" flex-wrap="nowrap" style="border: #999">
      <nut-col span="12">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 10px; color: gray">{{ t('common.status') }}</text>
          <nut-tag
            :color="item.status === 'active' ? 'green' : 'grey'"
            :style="{ fontWeight: 'bold', fontSize: '12px', textAlign: 'center', lineHeight: '20px' }"
          >
            {{ getStatusText(item.status) }}
          </nut-tag>
        </nut-space>
      </nut-col>
      <nut-col span="12">
        <nut-space direction="vertical" :style="{ '--nut-space-gap': '0px' }">
          <text style="font-size: 10px; color: #2f2f2f">{{ t('common.createTime') }}</text>
          <text style="font-size: 13px">{{ formatDate(item.created_at) }}</text>
        </nut-space>
      </nut-col>
    </nut-row>
  </div>

  <nut-row type="flex" justify="center" flex-wrap="nowrap">
    <nut-col span="22">
      <nut-button color="#101010" block size="large" @click="goCreate">{{ t('exchange.createButton') }}</nut-button>
    </nut-col>
  </nut-row>
  <nut-action-sheet v-model:visible="more" :menu-items="menuItems" :cancel-txt="t('common.cancel')" @choose="choose" />
</template>

<script setup lang="ts">
  import { useListStore } from '@/store/modules/list';
  import { useRouter } from 'vue-router';
  import { MoreX } from '@nutui/icons-vue';
  import { onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { deleteExchange } from '@/api';
  import { showToast } from '@nutui/nutui';
  import type { Exchange } from '@/views/list/types/exchange';

  const { t } = useI18n();
  const listStore = useListStore();
  const listData = ref<Exchange[]>([]);

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
    };
    return exchangeMap[exchangeId] || t('common.exchangeName');
  }

  // 掩码API Key
  function maskApiKey(apiKey: string): string {
    if (!apiKey) return '';
    return apiKey.substring(0, 3) + '***';
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
    const date = new Date(dateString);
    return date.toLocaleString();
  }

  const more = ref(false);
  const currentItem = ref<any>(null);

  const router = useRouter();
  const menuItems = [
    {
      name: t('common.view'),
      value: 'view',
    },
    {
      name: t('common.delete'),
      value: 'delete',
    },
  ];

  const deleteItem = async (item: any) => {
    try {
      // 调用删除接口
      await deleteExchange(item.id);

      // 删除成功后更新列表
      await listStore.fetchList();
      listData.value = listStore.dataList;

      // 关闭弹窗
      more.value = false;

      // 显示删除成功提示
      showToast.text(t('common.deleteSuccess'));
    } catch (error) {
      console.error('删除失败:', error);
      showToast.text(t('common.deleteFailed'));
    }
  };

  const choose = (item: { value: any }) => {
    if (item.value === 'delete') {
      deleteItem(currentItem.value);
    } else if (item.value === 'view') {
      // 查看操作逻辑
      router.push({ name: 'memberExchangeDetails', params: { id: currentItem.value.id } });
      console.log('查看:', currentItem.value);
    }
    more.value = false;
  };

  const goCreate = () => {
    router.push('/member/exchange/create');
  };
</script>

<style lang="scss"></style>

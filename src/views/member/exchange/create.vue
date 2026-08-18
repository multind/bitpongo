<template>
  <nut-form label-position="left" star-position="right" ref="formRef" :model-value="formData" :rules="rules">
    <nut-form-item :label="t('exchange.remarkName')" label-position="left" prop="name">
      <nut-input v-model="formData.name" :placeholder="t('exchange.remarkNamePlaceholder')" type="text" clearable />
    </nut-form-item>
    <nut-form-item :label="t('common.exchange')" label-position="left" required prop="exchange">
      <nut-radio-group v-model="formData.exchange" direction="horizontal">
        <nut-radio label="binance" shape="button">Binance - 币安</nut-radio>
        <nut-radio label="okx" shape="button">OKX - 欧易</nut-radio>
      </nut-radio-group>
    </nut-form-item>
    <nut-form-item :label="t('exchange.accessKey')" required label-position="left" prop="access_key">
      <nut-input
        v-model="formData.access_key"
        :placeholder="t('exchange.accessKeyPlaceholder')"
        type="text"
        @blur="customBlurValidate('access_key')"
        clearable
      />
    </nut-form-item>
    <nut-form-item :label="t('exchange.secretKey')" required label-position="left" prop="secret_key">
      <nut-input
        v-model="formData.secret_key"
        :placeholder="t('exchange.secretKeyPlaceholder')"
        type="text"
        clearable
        @blur="customBlurValidate('secret_key')"
      />
    </nut-form-item>
    <nut-form-item :label="t('exchange.passwordLabel')" label-position="left" prop="password">
      <nut-input v-model="formData.password" :placeholder="t('exchange.passwordPlaceholder')" type="text" clearable />
    </nut-form-item>
    <nut-cell-group>
      <nut-cell :title="t('exchange.availableBalance')">
        <template #desc>
          <span style="color: red">{{ accountBalance }}</span>
        </template>
      </nut-cell>
    </nut-cell-group>
    <nut-row type="flex" justify="center" style="margin: 10px 0">
      <nut-col span="22">
        <nut-button size="large" @click="asyncValidator">
          <template #icon>
            <Loading v-if="loading" />
          </template>
          {{ t('exchange.checkBalance') }}
        </nut-button>
      </nut-col>
    </nut-row>
    <nut-row type="flex" justify="center" style="margin: 10px 0">
      <nut-col span="22">
        <nut-button color="#101010" size="large" @click="submit"> {{ t('common.save') }} </nut-button>
      </nut-col>
    </nut-row>
  </nut-form>
</template>

<script setup lang="ts">
  import { useRouter } from 'vue-router';
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { checkExchange, createExchange } from '@/api';
  import { useListStore } from '@/store/modules/list';
  import { Loading } from '@nutui/icons-vue';
  import { showToast } from '@nutui/nutui';
  import type { Exchange } from '@/views/list/types/exchange.ts';

  const { t } = useI18n();
  const router = useRouter();
  const listStore = useListStore();
  const formData = ref(<Exchange>{
    name: '',
    exchange: 'binance',
    access_key: '',
    secret_key: '',
    password: '',
    status: '',
  });

  const formRef = ref<any>(null);
  const apiKeyLengthValidator = (val: string) => {
    if (val.length > 2) {
      return Promise.resolve();
    } else {
      return Promise.reject(t('exchange.inputInvalid'));
    }
  };
  // 补充完整的验证规则
  const rules = {
    name: [{ required: true, message: t('exchange.remarkRequired') }],
    exchange: [{ required: true, message: t('exchange.exchangeRequired') }],
    access_key: [
      { required: true, message: t('exchange.accessKeyRequired') },
      {
        message: t('exchange.accessKeyMinLength'),
        validator: apiKeyLengthValidator,
      },
    ],
    secret_key: [
      { required: true, message: t('exchange.secretKeyRequired') },
      {
        message: t('exchange.secretKeyMinLength'),
        validator: apiKeyLengthValidator,
      },
    ],
    password: [{ required: false, message: t('exchange.passwordRequired') }],
  };
  const reset = () => {
    formRef.value?.reset();
  };

  const submit = async () => {
    formRef.value?.validate().then(({ valid, errors }: { valid: boolean; errors: any[] }) => {
      if (valid) {
        // 调用创建接口
        createExchange(formData.value)
          .then((response) => {
            console.log('创建成功:', response);
            // 创建成功后刷新列表
            listStore.fetchList();
            reset();
            // 跳转到列表页或显示成功提示
            router.push('/member/exchange');
          })
          .catch((error) => {
            console.error('创建失败:', error);
            // 显示错误提示
            showToast.fail(error.message || t('common.createFailed'));
          });
        console.log('success:', formData.value);
      } else {
        console.warn('error:', errors);
      }
    });
  };

  // 失去焦点校验
  const customBlurValidate = (prop: any) => {
    formRef.value?.validate(prop).then(({ valid, errors }: { valid: boolean; errors: any[] }) => {
      if (valid) {
        console.log('success:', formData.value);
      } else {
        console.warn('error:', errors);
      }
    });
  };

  const loading = ref(false);
  const accountBalance = ref('-');
  // Promise 异步校验
  const asyncValidator = async () => {
    try {
      loading.value = true; // 显示加载状态
      if (!formData.value.access_key || !formData.value.secret_key || (formData.value.exchange === 'okx' && !formData.value.password)) {
        loading.value = false; // 隐藏加载状态
        showToast.fail(t('exchange.fillRequiredFields'));
        return Promise.reject(t('exchange.fillRequiredFields'));
      } else {
        return await checkExchange(formData.value)
          .then((response) => {
            showToast.success(t('common.querySuccess'));
            accountBalance.value = response.free;
            formData.value.status = 'active';
            return t('common.querySuccess');
          })
          .catch((error) => {
            console.error('查询失败，请检查:', error);
            showToast.fail(error.message || t('common.queryFailed'));
            formData.value.status = 'inactive';
            return Promise.reject(error);
          });
      }
    } catch (error) {
      console.error('查询失败:', error);
      return Promise.reject(error);
    } finally {
      loading.value = false; // 确保加载状态被隐藏
    }
  };
</script>

<style lang="scss">
  ::v-deep(.nut-cell) {
    position: unset;
    padding: 1.4667vw 1.2667vw !important;
  }
</style>

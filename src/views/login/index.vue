<template>
  <div class="login">
    <h5 style="font-family: 'PingFang SC', serif; font-size: 26px; font-weight: bold; color: #101010">{{ t('login.welcome') }}</h5>
    <nut-form ref="ruleForm" :model-value="formData" style="margin: 40px 0">
      <nut-form-item label="" required prop="name" :rules="[{ required: true, message: t('login.usernameRequired') }]">
        <nut-input v-model="formData.name" :placeholder="t('login.usernamePlaceholder')" type="text">
          <template #left>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
              <g fill="none">
                <rect
                  width="14.478"
                  height="12.87"
                  x="4.761"
                  y="8.38"
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  rx="3"
                />
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="1.5"
                  d="M15.217 8.38V5.967A3.217 3.217 0 0 0 12 2.75v0a3.217 3.217 0 0 0-3.217 3.217V8.38"
                />
                <circle cx="12" cy="14.815" r="1.5" fill="currentColor" />
              </g></svg
            >&nbsp; | &nbsp;
          </template>
        </nut-input>
      </nut-form-item>
      <nut-form-item label="" required prop="pwd" :rules="[{ required: true, message: t('login.passwordRequired') }]">
        <nut-input v-model="formData.pwd" :placeholder="t('login.passwordPlaceholder')" type="password">
          <template #left>
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 56 56">
              <path
                fill="currentColor"
                d="M28.012 28.023c5.578 0 10.125-4.968 10.125-11.015c0-6-4.5-10.711-10.125-10.711c-5.555 0-10.125 4.805-10.125 10.758c.023 6.023 4.57 10.968 10.125 10.968m0-3.539c-3.422 0-6.352-3.28-6.352-7.43c0-4.077 2.883-7.218 6.352-7.218c3.515 0 6.351 3.094 6.351 7.172c0 4.148-2.883 7.476-6.351 7.476m-14.719 25.22h29.438c3.89 0 5.742-1.173 5.742-3.75c0-6.142-7.735-15.024-20.461-15.024c-12.727 0-20.485 8.883-20.485 15.023c0 2.578 1.852 3.75 5.766 3.75m-1.125-3.54c-.61 0-.867-.164-.867-.656c0-3.844 5.953-11.04 16.71-11.04c10.759 0 16.688 7.196 16.688 11.04c0 .492-.234.656-.843.656Z"
              /></svg
            >&nbsp; | &nbsp;
          </template>
        </nut-input>
      </nut-form-item>
    </nut-form>

    <!-- 显示错误信息 -->
    <div v-if="errorMessages.length > 0" class="error-messages">
      <nut-cell v-for="(msg, index) in errorMessages" :key="index" class="error-item">
        <div class="error-text">{{ msg }}</div>
      </nut-cell>
    </div>

    <nut-space fill style="margin: 20px 10px">
      <text style="font-family: 'PingFang SC', serif; font-size: 13px; color: #5f5f5f">{{ t('login.agreePrefix') }}</text>
      <text style="font-family: 'PingFang SC', serif; font-size: 13px; color: #101010; text-decoration: underline" @click="agreement">{{
        t('login.agreement')
      }}</text>
    </nut-space>
    <nut-button block size="large" type="info" @click="submit" color="#101010">
      <template #default>
        <text style="font-size: 16px; font-weight: bold; color: whitesmoke"> {{ t('login.submit') }} </text>
      </template>
    </nut-button>
  </div>
</template>

<script setup lang="ts">
  import router from '@/router';
  import { reactive, ref } from 'vue';
  import { useUserStore } from '@/store/modules/user';
  import { useI18n } from 'vue-i18n';
  import { showToast } from '@nutui/nutui';

  const { t } = useI18n();
  const userStore = useUserStore();
  const formData = reactive({
    name: '',
    pwd: '',
  });
  const ruleForm = ref<any>(null);
  const errorMessages = ref<string[]>([]);

  const submit = () => {
    // 清空之前的错误信息
    errorMessages.value = [];

    ruleForm.value.validate().then(async ({ valid, errors }: any) => {
      if (valid) {
        const toast = showToast.loading(t('login.submitting'), {
          'cover-color': 'rgba(0, 0, 0, 0.5)',
          duration: 0,
          cover: true,
        });
        try {
          const userInfo = await userStore.login(formData.name, formData.pwd);
          console.log(userInfo);
          if (userInfo) {
            await router.push({ path: '/member' });
          }
        } catch (error: any) {
          // 处理登录失败，将错误信息添加到 errorMessages
          let errorMessage = t('login.failed');

          // 尝试从错误对象中获取详细错误信息
          if (error?.response?.data?.message) {
            errorMessage = error.response.data.message;
          } else if (error?.message) {
            errorMessage = error.message;
          } else if (typeof error === 'string') {
            errorMessage = error;
          }

          // 将错误信息添加到 errorMessages 数组
          errorMessages.value.push(errorMessage);
          console.error('登录失败:', error);
        } finally {
          toast.hide();
        }
      } else {
        console.log('error submit!!', errors);
        // 表单验证失败时，也将错误信息添加到 errorMessages
        if (errors && errors.length > 0) {
          errors.forEach((err: any) => {
            if (err.message) {
              errorMessages.value.push(err.message);
            }
          });
        }
      }
    });
  };

  const agreement = () => {
    console.log('agreement');
    router.push({ path: '/agreement' });
  };
</script>

<style scoped lang="scss">
  .login {
    padding: 20px;

    .nut-form-item {
      margin-top: 20px;
      border-radius: 20px;
    }
  }

  .error-messages {
    margin: 10px 0;

    .error-item {
      padding: 8px 12px;
      margin-bottom: 8px;
      background-color: #fde3e3;
      border: 1px solid #fad3d3;
      border-radius: 4px;

      .error-text {
        font-size: 24px;
        color: #e34b4b;
      }
    }
  }

  ::v-deep(.nut-form-item.error.line::before) {
    border-color: white;
  }
</style>

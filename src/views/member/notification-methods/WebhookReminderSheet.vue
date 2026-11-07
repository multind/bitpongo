<template>
  <section class="webhook-sheet" role="dialog" aria-modal="true" :aria-label="t('outboundWebhook.title')">
    <header>
      <h2>{{ t('outboundWebhook.title') }}</h2>
      <button type="button" @click="emit('close')">{{ t('common.close') }}</button>
    </header>
    <p>{{ t('outboundWebhook.intro') }}</p>
    <p v-if="failed" role="alert">{{ t('outboundWebhook.failed') }}</p>
    <p v-if="sent" role="status">{{ t('outboundWebhook.sent') }}</p>
    <p v-if="busy" role="status">{{ t('common.loading') }}</p>
    <button v-if="failed && !settings" type="button" :disabled="busy" @click="run(read)">{{ t('outboundWebhook.retry') }}</button>
    <template v-if="settings">
      <p v-if="!settings.available">{{ t('notificationMethods.unavailable') }}</p>
      <article v-for="item in settings.items" :key="item.id">
        <strong>{{ item.name }}</strong>
        <small
          >{{ platforms[item.provider] }} · {{ item.maskedUrl }} ·
          {{ t(item.enabled ? 'outboundWebhook.enabled' : 'outboundWebhook.disabled') }}</small
        >
        <div v-if="removing === item.id" class="actions">
          <span>{{ t('outboundWebhook.confirmDelete') }}</span>
          <button type="button" :disabled="busy" @click="remove(item.id)">{{ t('outboundWebhook.remove') }}</button>
          <button type="button" :disabled="busy" @click="removing = null">{{ t('common.cancel') }}</button>
        </div>
        <div v-else class="actions">
          <button type="button" :disabled="busy || !settings.available" @click="edit(item)">{{ t('outboundWebhook.edit') }}</button>
          <button type="button" :disabled="busy || !settings.available" @click="toggle(item)">{{
            t(item.enabled ? 'outboundWebhook.disable' : 'outboundWebhook.enable')
          }}</button>
          <button type="button" :disabled="busy || !settings.available" @click="sendTest(item.id)">{{ t('outboundWebhook.test') }}</button>
          <button type="button" :disabled="busy" @click="removing = item.id">{{ t('outboundWebhook.remove') }}</button>
        </div>
      </article>
      <button v-if="settings.available && !editing" type="button" @click="edit()">{{ t('outboundWebhook.add') }}</button>
      <form v-if="settings.available && editing" @submit.prevent="save">
        <label>
          {{ t('outboundWebhook.provider') }}
          <select v-model="provider" :disabled="busy || editId !== null">
            <option v-for="key in webhookProviders" :key="key" :value="key">{{ platforms[key] }}</option>
          </select>
        </label>
        <p>{{ t(`outboundWebhook.help.${provider}`) }}</p>
        <label>
          {{ t('outboundWebhook.name') }}
          <input v-model.trim="name" required maxlength="80" :disabled="busy" />
        </label>
        <label>
          Webhook URL
          <input
            v-model.trim="url"
            type="url"
            autocomplete="off"
            autocapitalize="off"
            spellcheck="false"
            :required="editId === null"
            :placeholder="editId === null ? 'https://' : t('outboundWebhook.keep')"
            :disabled="busy"
          />
        </label>
        <template v-if="supportsSignature">
          <label>
            {{ t('outboundWebhook.secret') }}
            <input
              v-model="secret"
              type="password"
              autocomplete="new-password"
              :disabled="busy || clearSecret"
              :placeholder="editId === null ? '' : t('outboundWebhook.keep')"
            />
          </label>
          <label v-if="editId !== null" class="check">
            <input v-model="clearSecret" type="checkbox" :disabled="busy" /> {{ t('outboundWebhook.clearSecret') }}
          </label>
        </template>
        <div class="actions">
          <button type="submit" class="primary-action" :disabled="busy">{{ t('common.save') }}</button>
          <button type="button" :disabled="busy" @click="reset">{{ t('common.cancel') }}</button>
        </div>
      </form>
    </template>
  </section>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import {
    createWebhookDestination,
    deleteWebhookDestination,
    getWebhookDestinations,
    testWebhookDestination,
    updateWebhookDestination,
    webhookProviders,
    type WebhookDestination,
    type WebhookProvider,
  } from '@/api/webhookReminderDestinations';

  const emit = defineEmits<{ close: [] }>();
  const { t, locale } = useI18n();
  const platforms = computed(() => ({
    DINGTALK: locale.value === 'zh-cn' ? '钉钉' : locale.value === 'zh-tw' ? '釘釘' : 'DingTalk',
    FEISHU: locale.value === 'en-us' ? 'Feishu' : '飛書'.replace('飛', locale.value === 'zh-cn' ? '飞' : '飛'),
    SLACK: 'Slack',
    DISCORD: 'Discord',
  }));
  const settings = ref<Awaited<ReturnType<typeof getWebhookDestinations>>>();
  const busy = ref(false),
    failed = ref(false),
    sent = ref(false);
  const editing = ref(false),
    editId = ref<number | null>(null),
    removing = ref<number | null>(null);
  const provider = ref<WebhookProvider>('DINGTALK');
  const name = ref(''),
    url = ref(''),
    secret = ref(''),
    clearSecret = ref(false);
  const supportsSignature = computed(() => provider.value === 'DINGTALK' || provider.value === 'FEISHU');
  const read = async () => {
    settings.value = await getWebhookDestinations();
  };

  async function run(action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = true;
    failed.value = sent.value = false;
    try {
      await action();
    } catch {
      failed.value = true;
    } finally {
      busy.value = false;
    }
  }
  function reset() {
    editing.value = false;
    editId.value = null;
    name.value = url.value = secret.value = '';
    clearSecret.value = false;
  }
  function edit(item?: WebhookDestination) {
    reset();
    editId.value = item?.id ?? null;
    provider.value = item?.provider ?? 'DINGTALK';
    name.value = item?.name ?? '';
    editing.value = true;
  }
  const save = () =>
    run(async () => {
      const draft = {
        name: name.value,
        ...(url.value ? { url: url.value } : {}),
        ...(supportsSignature.value && (clearSecret.value || secret.value.trim())
          ? { signingSecret: clearSecret.value ? '' : secret.value.trim() }
          : {}),
      };
      if (editId.value === null) await createWebhookDestination({ provider: provider.value, ...draft });
      else await updateWebhookDestination(editId.value, draft);
      reset();
      await read();
    });
  const toggle = (item: WebhookDestination) =>
    run(async () => {
      await updateWebhookDestination(item.id, { enabled: !item.enabled });
      await read();
    });
  const sendTest = (id: number) =>
    run(async () => {
      await testWebhookDestination(id);
      sent.value = true;
    });
  const remove = (id: number) =>
    run(async () => {
      await deleteWebhookDestination(id);
      removing.value = null;
      if (editId.value === id) reset();
      await read();
    });
  onMounted(() => void run(read));
</script>

<style scoped>
  .webhook-sheet {
    display: grid;
    gap: 0.8rem;
    max-height: 84vh;
    max-height: 84dvh;
    padding: 1rem 1rem calc(1rem + env(safe-area-inset-bottom));
    overflow: auto;
  }

  header,
  .actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
    align-items: center;
  }

  header {
    justify-content: space-between;
  }

  h2,
  p {
    margin: 0;
  }

  h2 {
    font-size: 1.15rem;
  }

  p,
  small {
    line-height: 1.45;
    overflow-wrap: anywhere;
  }

  article,
  form {
    display: grid;
    gap: 0.6rem;
    padding: 0.85rem;
    border: 1px solid #e6e2dd;
    border-radius: 0.8rem;
  }

  label {
    display: grid;
    gap: 0.3rem;
    min-width: 0;
  }

  label.check {
    display: flex;
    align-items: center;
  }

  input:not([type='checkbox']),
  select {
    box-sizing: border-box;
    width: 100%;
    min-width: 0;
    padding: 0.55rem;
    font-size: 1rem;
    border: 1px solid #d8d4ce;
    border-radius: 0.5rem;
  }

  button {
    min-height: 2.5rem;
    padding: 0.35rem 0.65rem;
    color: inherit;
    background: transparent;
    border: 1px solid #dedad4;
    border-radius: 0.6rem;
  }

  button:disabled {
    opacity: 0.55;
  }

  button.primary-action {
    color: white;
    background: #1766cc;
    border-color: #1766cc;
  }

  [role='alert'] {
    color: #a42925;
  }
</style>

<template>
  <main class="alerts-page">
    <p v-if="error" role="alert">{{ t('alerts.failed') }}</p>
    <p v-if="!available" role="status">{{ t('webhook.unavailable') }}</p>
    <form class="alert-card" @submit.prevent="save">
      <h2>{{ t('webhook.title') }}</h2>
      <label for="hook-name">{{ t('alerts.name') }}</label
      ><input id="hook-name" v-model="draft.name" maxlength="100" required />
      <label for="hook-description">{{ t('webhook.description') }}</label
      ><textarea id="hook-description" v-model="draft.description" maxlength="500" />
      <label for="hook-keywords">{{ t('webhook.keywords') }}</label
      ><input id="hook-keywords" v-model="draft.keywords" maxlength="500" /> <label for="hook-ips">{{ t('webhook.ips') }}</label
      ><input id="hook-ips" v-model="draft.allowedIps" maxlength="1000" />
      <p class="meta">{{ t('webhook.hint') }}</p>
      <button type="submit" :disabled="busy">{{ t('common.save') }}</button>
      <button v-if="editing" type="button" :disabled="busy" @click="reset">{{ t('common.cancel') }}</button>
    </form>
    <section v-if="generated" class="alert-card">
      <h3>{{ t('webhook.credentials') }}</h3
      ><p>{{ t('webhook.secretHint') }}</p> <label>{{ t('webhook.url') }}</label
      ><input :value="endpoint(generated.publicId)" readonly /> <label>{{ t('webhook.signingKey') }}</label
      ><input :value="generated.signingKey" readonly autocomplete="off" />
      <p class="meta">{{ t('webhook.signatureHint') }}</p>
      <button @click="generated = null">{{ t('common.confirm') }}</button>
    </section>
    <article v-for="rule in rules" :key="rule.id" class="alert-card">
      <h3>{{ rule.name }}</h3
      ><p>{{ t(`webhook.status.${rule.status}`) }}</p
      ><p>{{ rule.description }}</p>
      <p v-if="rule.status === 'ACTIVE'" class="hook-url">{{ endpoint(rule.publicId) }}</p>
      <div class="actions">
        <button :disabled="busy" @click="edit(rule)">{{ t('alerts.edit') }}</button>
        <button data-test="webhook-activate" :disabled="busy || !available" @click="activate(rule.id)">{{ t('webhook.activate') }}</button>
        <button :disabled="busy || rule.status === 'REVOKED'" @click="revoke(rule.id)">{{ t('webhook.revoke') }}</button>
      </div>
    </article>
  </main>
</template>
<script setup lang="ts">
  import { onMounted, onUnmounted, reactive, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
  import { getWebhooks, webhookAvailable, createWebhook, saveWebhook, activateWebhook, revokeWebhook } from '@/api/webhooks';
  import type { WebhookActivation, WebhookDraft, WebhookRule } from '@/api/webhooks';
  import { runtimeConfig } from '@/config/runtime';
  const { t } = useI18n();
  const rules = ref<WebhookRule[]>([]);
  const available = ref(false);
  const busy = ref(true);
  const error = ref(false);
  const editing = ref<number | null>(null);
  const generated = ref<WebhookActivation | null>(null);
  const draft = reactive<WebhookDraft>({ name: '', description: '', keywords: '', allowedIps: '' });
  const endpoint = (id: string) =>
    new URL(`${runtimeConfig.apiBaseUrl.replace(/\/$/, '')}/webhooks/receive/${encodeURIComponent(id)}`, window.location.origin).href;
  function reset() {
    editing.value = null;
    Object.assign(draft, { name: '', description: '', keywords: '', allowedIps: '' });
  }
  function edit(rule: WebhookRule) {
    editing.value = rule.id;
    Object.assign(draft, { name: rule.name, description: rule.description, keywords: rule.keywords, allowedIps: rule.allowedIps });
  }
  async function run(action: () => Promise<unknown>) {
    if (busy.value) return;
    busy.value = true;
    error.value = false;
    try {
      await action();
      rules.value = await getWebhooks();
    } catch {
      error.value = true;
    } finally {
      busy.value = false;
    }
  }
  async function save() {
    if (!draft.name.trim()) return;
    await run(async () => {
      if (editing.value) await saveWebhook(editing.value, { ...draft });
      else await createWebhook({ ...draft });
      reset();
    });
  }
  function activate(id: number) {
    showDialog({
      title: t('webhook.activate'),
      content: t('webhook.rotateHint'),
      onOk: () =>
        run(async () => {
          generated.value = await activateWebhook(id);
        }),
    });
  }
  function revoke(id: number) {
    showDialog({
      title: t('webhook.revoke'),
      content: t('webhook.revokeHint'),
      onOk: () =>
        run(async () => {
          await revokeWebhook(id);
          generated.value = null;
        }),
    });
  }
  onMounted(async () => {
    try {
      [rules.value, available.value] = await Promise.all([getWebhooks(), webhookAvailable()]);
    } catch {
      error.value = true;
    } finally {
      busy.value = false;
    }
  });
  onUnmounted(() => {
    generated.value = null;
  });
</script>
<style scoped lang="scss">
  @use './shared.scss';

  .hook-url {
    overflow-wrap: anywhere;
  }

  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 80px;
  }
</style>

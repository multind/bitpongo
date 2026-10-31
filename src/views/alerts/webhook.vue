<template>
  <main class="wizard-page">
    <template v-if="creating || saved">
      <WizardSteps :step="step" :labels="stepLabels" />
      <h1 ref="heading" tabindex="-1">{{ saved ? t('wizard.saved') : stepLabels[step - 1] }}</h1>
    </template>
    <header v-else-if="!generated" class="wizard-list-heading">
      <h1>{{ t('webhook.title') }}</h1>
      <button class="wizard-primary" data-test="webhook-create" :disabled="busy" @click="start">{{ t('wizard.newWebhook') }}</button>
    </header>
    <p v-if="error" role="alert">{{ t(error) }}</p>
    <p v-if="!available && !loading" class="wizard-meta" role="status">{{ t('webhook.unavailable') }}</p>
    <form v-if="creating && !saved" class="wizard-form" novalidate @submit.prevent="save">
      <div class="wizard-fields">
        <template v-if="step === 1">
          <label for="hook-name">{{ t('alerts.name') }}</label
          ><input id="hook-name" v-model="draft.name" maxlength="100" required />
          <label for="hook-description">{{ t('webhook.description') }}</label
          ><textarea id="hook-description" v-model="draft.description" maxlength="500" />
        </template>
        <template v-if="step === 2">
          <label for="hook-keywords">{{ t('webhook.keywords') }}</label
          ><input id="hook-keywords" v-model="draft.keywords" maxlength="500" />
          <p class="wizard-meta">{{ t('webhook.hint') }}</p>
        </template>
        <template v-if="step === 3">
          <label for="hook-ips">{{ t('webhook.ips') }}</label>
          <textarea
            id="hook-ips"
            v-model="draft.allowedIps"
            maxlength="1000"
            :aria-invalid="error === 'wizard.invalidIps'"
            aria-describedby="hook-ip-hint"
          />
          <p id="hook-ip-hint" class="wizard-meta">{{ t('wizard.ipHint') }}</p>
          <section class="wizard-note"
            ><h2>{{ t('webhook.signingKey') }}</h2
            ><p>{{ t('wizard.savedHint') }}</p></section
          >
        </template>
        <section v-if="step === 4" class="wizard-note">
          <h2>{{ t('wizard.defaultDelivery') }}</h2>
          <p>{{ t('webhook.hint') }}</p
          ><p class="wizard-meta">{{ t('wizard.deliveryHelp') }}</p>
        </section>
        <dl v-if="step === 5" class="wizard-review" data-test="wizard-review">
          <div
            ><dt>{{ t('alerts.name') }}</dt
            ><dd>{{ draft.name }}</dd></div
          >
          <div
            ><dt>{{ t('webhook.description') }}</dt
            ><dd>{{ draft.description || '—' }}</dd></div
          >
          <div
            ><dt>{{ t('webhook.keywords') }}</dt
            ><dd>{{ draft.keywords || '—' }}</dd></div
          >
          <div
            ><dt>{{ t('webhook.ips') }}</dt
            ><dd>{{ draft.allowedIps || '—' }}</dd></div
          >
          <div
            ><dt>{{ t('wizard.delivery') }}</dt
            ><dd>{{ t('wizard.defaultDelivery') }}</dd></div
          >
        </dl>
      </div>
      <footer class="wizard-actions">
        <button v-if="step > 1" type="button" data-test="wizard-back" :disabled="busy" @click="move(-1)">{{ t('alerts.previous') }}</button>
        <button v-else type="button" :disabled="busy" @click="reset">{{ t('common.cancel') }}</button>
        <button v-if="step < 5" type="button" class="wizard-primary" data-test="wizard-next" :disabled="busy" @click="next">{{
          t('alerts.next')
        }}</button>
        <button v-else type="submit" class="wizard-primary" :disabled="busy">{{ busy ? t('common.loading') : t('common.save') }}</button>
      </footer>
    </form>
    <section v-if="saved" class="wizard-note" data-test="webhook-saved">
      <p>{{ t('wizard.savedHint') }}</p>
      <button class="wizard-primary" @click="reset">{{ t('wizard.done') }}</button>
    </section>
    <section v-if="generated" class="wizard-note">
      <h1 tabindex="-1" ref="credentialsHeading">{{ t('webhook.credentials') }}</h1
      ><p>{{ t('webhook.secretHint') }}</p> <label>{{ t('webhook.url') }}</label
      ><input :value="endpoint(generated.publicId)" readonly /> <label>{{ t('webhook.signingKey') }}</label
      ><input data-test="webhook-signing-key" :value="generated.signingKey" readonly autocomplete="off" />
      <p class="wizard-meta">{{ t('webhook.signatureHint') }}</p>
      <button class="wizard-primary" data-test="webhook-dismiss-credentials" @click="generated = null">{{ t('common.confirm') }}</button>
    </section>
    <p v-if="listError" role="alert">{{ t(saved ? 'wizard.listFailed' : 'alerts.failed') }}</p>
    <button v-if="listError" data-test="webhook-refresh" :disabled="busy" @click="refresh">{{ t('market.retry') }}</button>
    <template v-if="!creating && !saved && !generated">
      <p v-if="loading" role="status">{{ t('common.loading') }}</p>
      <p v-else-if="!rules.length && !listError" class="wizard-meta">{{ t('wizard.emptyHooks') }}</p>
      <article v-for="rule in rules" :key="rule.id" class="wizard-rule">
        <h3>{{ rule.name }}</h3
        ><p>{{ t(`webhook.status.${rule.status}`) }}</p
        ><p>{{ rule.description }}</p>
        <p v-if="rule.status === 'ACTIVE'" class="hook-url">{{ endpoint(rule.publicId) }}</p>
        <div class="actions">
          <button data-test="webhook-edit" :disabled="busy" @click="edit(rule)">{{ t('alerts.edit') }}</button>
          <button data-test="webhook-activate" :disabled="busy || !available" @click="activate(rule.id)">{{
            t('webhook.activate')
          }}</button>
          <button :disabled="busy || rule.status === 'REVOKED'" @click="revoke(rule.id)">{{ t('webhook.revoke') }}</button>
        </div>
      </article>
    </template>
  </main>
</template>
<script setup lang="ts">
  import { computed, nextTick, onMounted, onUnmounted, reactive, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { showDialog } from '@nutui/nutui';
  import { getWebhooks, webhookAvailable, createWebhook, saveWebhook, activateWebhook, revokeWebhook } from '@/api/webhooks';
  import type { WebhookActivation, WebhookDraft, WebhookRule } from '@/api/webhooks';
  import { runtimeConfig } from '@/config/runtime';
  import WizardSteps from './components/WizardSteps.vue';
  import { normalizeWebhookIps } from './webhookIps';
  const { t } = useI18n();
  const rules = ref<WebhookRule[]>([]);
  const available = ref(false);
  const busy = ref(true);
  const error = ref('');
  const listError = ref(false);
  const loading = ref(true);
  const creating = ref(false);
  const saved = ref(false);
  const step = ref(1);
  const heading = ref<HTMLElement | null>(null);
  const credentialsHeading = ref<HTMLElement | null>(null);
  const stepLabels = computed(() => ['hookIdentity', 'keywords', 'security', 'delivery', 'review'].map((key) => t(`wizard.${key}`)));
  const editing = ref<number | null>(null);
  const generated = ref<WebhookActivation | null>(null);
  const draft = reactive<WebhookDraft>({ name: '', description: '', keywords: '', allowedIps: '' });
  const endpoint = (id: string) =>
    new URL(`${runtimeConfig.apiBaseUrl.replace(/\/$/, '')}/webhooks/receive/${encodeURIComponent(id)}`, window.location.origin).href;
  function reset() {
    creating.value = false;
    saved.value = false;
    step.value = 1;
    error.value = '';
    editing.value = null;
    Object.assign(draft, { name: '', description: '', keywords: '', allowedIps: '' });
  }
  function start() {
    reset();
    creating.value = true;
    void focusHeading();
  }
  async function focusHeading() {
    await nextTick();
    heading.value?.focus();
  }
  function move(delta: number) {
    error.value = '';
    step.value += delta;
    void focusHeading();
  }
  function validName() {
    return !!draft.name.trim();
  }
  function next() {
    if (busy.value) return;
    if (step.value === 1 && !validName()) {
      error.value = 'alerts.invalid';
      return;
    }
    if (step.value === 3 && normalizeWebhookIps(draft.allowedIps) === null) {
      error.value = 'wizard.invalidIps';
      return;
    }
    move(1);
  }
  function edit(rule: WebhookRule) {
    reset();
    creating.value = true;
    editing.value = rule.id;
    Object.assign(draft, { name: rule.name, description: rule.description, keywords: rule.keywords, allowedIps: rule.allowedIps });
    void focusHeading();
  }
  async function refreshRules() {
    try {
      rules.value = await getWebhooks();
      listError.value = false;
    } catch {
      listError.value = true;
    }
  }
  async function run(action: () => Promise<unknown>) {
    if (busy.value) return;
    busy.value = true;
    error.value = '';
    try {
      await action();
      await refreshRules();
    } catch {
      error.value = 'alerts.failed';
    } finally {
      busy.value = false;
    }
  }
  async function save() {
    if (busy.value || !creating.value || saved.value) return;
    if (step.value < 5) {
      next();
      return;
    }
    if (!validName()) {
      step.value = 1;
      error.value = 'alerts.invalid';
      return;
    }
    const allowedIps = normalizeWebhookIps(draft.allowedIps);
    if (allowedIps === null) {
      step.value = 3;
      error.value = 'wizard.invalidIps';
      void focusHeading();
      return;
    }
    await run(async () => {
      const data = { ...draft, name: draft.name.trim(), allowedIps };
      if (editing.value) await saveWebhook(editing.value, data);
      else await createWebhook(data);
      saved.value = true;
      creating.value = false;
      void focusHeading();
    });
  }
  function activate(id: number) {
    showDialog({
      title: t('webhook.activate'),
      content: t('webhook.rotateHint'),
      onOk: () =>
        run(async () => {
          generated.value = await activateWebhook(id);
          await nextTick();
          credentialsHeading.value?.focus();
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
  async function refresh() {
    if (busy.value && !loading.value) return;
    busy.value = true;
    loading.value = true;
    try {
      await Promise.all([
        refreshRules(),
        webhookAvailable().then((value) => {
          available.value = value;
        }),
      ]);
    } catch {
      listError.value = true;
    } finally {
      busy.value = false;
      loading.value = false;
    }
  }
  onMounted(refresh);
  onUnmounted(() => {
    generated.value = null;
  });
</script>
<style scoped lang="scss">
  @use './wizard.scss';

  .hook-url {
    overflow-wrap: anywhere;
  }

  textarea {
    box-sizing: border-box;
    width: 100%;
    min-height: 80px;
  }
</style>

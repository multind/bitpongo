<template>
  <main class="notification-methods-page">
    <h1 class="page-heading">{{ t('notificationMethods.title') }}</h1>
    <p class="intro">{{ t('notificationMethods.intro') }}</p>
    <p v-if="busy && !loaded" class="feedback" role="status">{{ t('common.loading') }}</p>
    <p v-else-if="error && !loaded" class="feedback error" role="alert">{{ t('notificationMethods.saveFailed') }}</p>
    <template v-if="channels">
      <section class="settings-card" aria-labelledby="channel-heading">
        <h2 id="channel-heading" class="sr-only">{{ t('notificationMethods.title') }}</h2>
        <div v-for="key in channelKeys" :key="key" class="channel-row">
          <span class="channel-badge" aria-hidden="true">{{ badges[key] }}</span>
          <div class="channel-copy">
            <strong>{{ t(`notificationMethods.channels.${key}`) }}</strong>
            <span>{{ t(`notificationMethods.hints.${key}`) }}</span>
            <small class="channel-status" :class="{ available: channelState(key).available }">{{
              channelState(key).available ? t('notificationMethods.available') : t('notificationMethods.unavailable')
            }}</small>
          </div>
          <RouterLink v-if="key === 'bitpongo'" class="setup-link" to="/member/notice">{{ t('notificationMethods.configure') }}</RouterLink>
          <label v-else class="switch">
            <input
              v-model="draft[key]"
              type="checkbox"
              role="switch"
              :aria-label="t(`notificationMethods.channels.${key}`)"
              :disabled="busy || !loaded"
            />
            <span class="track" aria-hidden="true" />
          </label>
        </div>
      </section>
      <section class="settings-card" aria-labelledby="perception-heading">
        <h2 id="perception-heading">{{ t('notificationMethods.perception') }}</h2>
        <p class="meta">{{ t('notificationMethods.perceptionHint') }}</p>
        <ol class="perception-order">
          <li
            v-for="key in perceptionOrder"
            :key="key"
            :data-channel="key"
            draggable="true"
            @dragstart="dragged = key"
            @dragover.prevent
            @drop.prevent="moveBefore(key)"
            @dragend="dragged = null"
          >
            <span>{{ t(`notificationMethods.channels.${key}`) }}</span>
            <button
              type="button"
              class="drag-handle"
              :disabled="busy"
              :aria-label="t(`notificationMethods.channels.${key}`)"
              @pointerdown.prevent="startDrag($event, key)"
              @pointerup="endDrag"
              @pointercancel="dragged = null"
              @keydown.up.prevent="moveBy(key, -1)"
              @keydown.down.prevent="moveBy(key, 1)"
              >⠿</button
            >
          </li>
        </ol>
        <label class="confirmation-row">
          <span class="confirmation-copy">
            <strong>{{ t('notificationMethods.confirmation') }}</strong>
            <small>{{ t('notificationMethods.confirmationHint') }}</small>
          </span>
          <span class="switch">
            <input
              v-model="confirmationEnabled"
              type="checkbox"
              role="switch"
              :aria-label="t('notificationMethods.confirmation')"
              :disabled="busy || !loaded"
            />
            <span class="track" aria-hidden="true" />
          </span>
        </label>
      </section>
      <p v-if="error" class="feedback error" role="alert">{{ t('notificationMethods.saveFailed') }}</p>
      <p v-if="saved" class="feedback success" role="status">{{ t('notificationMethods.saveSuccess') }}</p>
      <button class="primary" type="button" data-test="notification-methods-save" :disabled="busy || !loaded" @click="save">
        {{ busy ? t('common.loading') : t('common.save') }}
      </button>
    </template>
  </main>
</template>
<script setup lang="ts">
  import { onMounted, reactive, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import {
    getNotificationChannels,
    saveNotificationChannels,
    saveNotificationOrder,
    type NotificationChannels,
  } from '@/api/notificationChannels';

  const { t } = useI18n();
  const channelKeys = ['bitpongo', 'email', 'message', 'call', 'dingding', 'feishu', 'telegram'] as const;
  type ChannelKey = (typeof channelKeys)[number];
  type EditableKey = Exclude<ChannelKey, 'bitpongo'>;
  const editableKeys: EditableKey[] = ['email', 'message', 'call', 'dingding', 'feishu', 'telegram'];

  const perceptionOrder = ref<ChannelKey[]>([]);
  const dragged = ref<ChannelKey | null>(null);
  function moveBefore(key: ChannelKey) {
    if (busy.value || !dragged.value || dragged.value === key) return;
    const next = perceptionOrder.value.filter((item) => item !== dragged.value);
    next.splice(next.indexOf(key), 0, dragged.value);
    perceptionOrder.value = next;
    dragged.value = null;
    saved.value = false;
  }
  function startDrag(event: PointerEvent, key: ChannelKey) {
    if (busy.value) return;
    dragged.value = key;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
  }
  function endDrag(event: PointerEvent) {
    const key = document.elementFromPoint(event.clientX, event.clientY)?.closest('[data-channel]')?.getAttribute('data-channel');
    if (key && channelKeys.includes(key as ChannelKey)) moveBefore(key as ChannelKey);
    dragged.value = null;
  }
  function moveBy(key: ChannelKey, delta: number) {
    const target = perceptionOrder.value[perceptionOrder.value.indexOf(key) + delta];
    if (!target || busy.value) return;
    const next = [...perceptionOrder.value];
    const from = next.indexOf(key),
      to = next.indexOf(target);
    [next[from], next[to]] = [next[to], next[from]];
    perceptionOrder.value = next;
    saved.value = false;
  }
  const badges: Record<ChannelKey, string> = {
    bitpongo: 'APP',
    email: '@',
    message: 'SMS',
    call: 'TEL',
    dingding: 'DD',
    feishu: 'FS',
    telegram: 'TG',
  };
  const channels = ref<NotificationChannels | null>(null);
  const loaded = ref(false);
  const busy = ref(false);
  const error = ref(false);
  const saved = ref(false);
  const draft = reactive<Record<ChannelKey, boolean>>({
    bitpongo: false,
    email: false,
    message: false,
    call: false,
    dingding: false,
    feishu: false,
    telegram: false,
  });
  const confirmationEnabled = ref(false);

  const applyChannels = (value: NotificationChannels) => {
    for (const key of editableKeys) draft[key] = value[key].enabled;
    confirmationEnabled.value = value.confirmationEnabled;
    channels.value = value;
    perceptionOrder.value = [...channelKeys].sort((a, b) => value[a].sequence - value[b].sequence);
    loaded.value = true;
  };

  const channelState = (key: ChannelKey) => {
    const value = channels.value?.[key];
    return {
      enabled: key === 'bitpongo' ? (value?.enabled ?? false) : draft[key],
      available: value?.available ?? false,
    };
  };

  const load = async () => {
    busy.value = true;
    error.value = false;
    saved.value = false;
    try {
      applyChannels(await getNotificationChannels());
    } catch {
      error.value = true;
    } finally {
      busy.value = false;
    }
  };

  const save = async () => {
    if (busy.value || !loaded.value) return;
    busy.value = true;
    error.value = false;
    saved.value = false;
    try {
      const order = [...perceptionOrder.value];
      await saveNotificationChannels({
        emailEnabled: draft.email,
        messageEnabled: draft.message,
        callEnabled: draft.call,
        dingdingEnabled: draft.dingding,
        feishuEnabled: draft.feishu,
        telegramEnabled: draft.telegram,
        confirmationEnabled: confirmationEnabled.value,
      });
      applyChannels(await saveNotificationOrder(order));
      saved.value = true;
    } catch {
      error.value = true;
    } finally {
      busy.value = false;
    }
  };

  onMounted(() => {
    void load();
  });
</script>
<style scoped lang="scss">
  .notification-methods-page {
    padding: 1.5rem 0.5rem 1rem;
  }

  .page-heading {
    margin: 0;
    font-size: 2rem;
    font-weight: 750;
    line-height: 1.2;
    letter-spacing: -0.04em;
  }

  .intro {
    margin: 0.6rem 0 1.25rem;
    font-size: 0.8rem;
    line-height: 1.6;
    color: #81776d;
  }

  .settings-card {
    padding: 0 1rem;
    margin-bottom: 1rem;
    background: #fff;
    border: 1px solid #f1e8e0;
    border-radius: 1rem;
  }

  .channel-row {
    display: flex;
    gap: 0.75rem;
    align-items: center;
    min-height: 5rem;
    padding: 0.75rem 0;
    border-bottom: 1px solid #eae4de;
  }

  .channel-row:last-child {
    border-bottom: 0;
  }

  .channel-badge {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 2.4rem;
    height: 2.4rem;
    font-size: 0.65rem;
    font-weight: 700;
    color: #fb791a;
    background: #fff1e4;
    border-radius: 50%;
  }

  .channel-copy {
    flex: 1;
    min-width: 0;
  }

  .channel-copy strong {
    display: block;
    font-size: 0.9rem;
    font-weight: 650;
  }

  .channel-copy span {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.75rem;
    line-height: 1.5;
    color: #8a8681;
  }

  .channel-status {
    display: inline-block;
    margin-top: 0.35rem;
    font-size: 0.65rem;
    color: #9a8d82;
  }

  .channel-status.available {
    color: #328642;
  }

  .setup-link {
    flex-shrink: 0;
    font-size: 0.75rem;
    color: #1989fa;
    text-decoration: none;
  }

  .settings-card h2 {
    padding-top: 1rem;
    margin: 0;
    font-size: 0.95rem;
    font-weight: 650;
  }

  .meta {
    margin: 0.5rem 0 0.75rem;
    font-size: 0.75rem;
    line-height: 1.6;
    color: #8a8681;
  }

  .perception-order {
    padding-left: 1.25rem;
    margin: 0 0 0.75rem;
    font-size: 0.8rem;
    line-height: 1.8;
    color: #615a53;
  }

  .perception-order li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 2.75rem;
    border-bottom: 1px solid #f1e8e0;
  }

  .drag-handle {
    min-width: 2.75rem;
    min-height: 2.75rem;
    font-size: 1.25rem;
    color: #81766b;
    touch-action: none;
    cursor: grab;
    background: transparent;
    border: 0;
  }

  .confirmation-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
    padding: 0.9rem 0;
    border-top: 1px solid #eae4de;
  }

  .confirmation-copy {
    flex: 1;
    min-width: 0;
  }

  .confirmation-copy strong {
    display: block;
    font-size: 0.85rem;
  }

  .confirmation-copy small {
    display: block;
    margin-top: 0.25rem;
    font-size: 0.72rem;
    line-height: 1.5;
    color: #8a8681;
  }

  .switch {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
  }

  .switch input {
    position: absolute;
    width: 0;
    height: 0;
    opacity: 0;
  }

  .track {
    position: relative;
    display: block;
    width: 2.5rem;
    height: 1.4rem;
    background: #e5ddd6;
    border-radius: 999px;
    transition: background 0.2s ease;
  }

  .track::after {
    position: absolute;
    top: 0.15rem;
    left: 0.15rem;
    width: 1.1rem;
    height: 1.1rem;
    content: '';
    background: #fff;
    border-radius: 50%;
    transition: transform 0.2s ease;
  }

  .switch input:checked + .track {
    background: #1989fa;
  }

  .switch input:checked + .track::after {
    transform: translateX(1.1rem);
  }

  .switch input:focus-visible + .track {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }

  .feedback {
    margin: 0.5rem 0;
    font-size: 0.8rem;
    color: #81776d;
    text-align: center;
  }

  .feedback.error {
    color: #b93d31;
  }

  .feedback.success {
    color: #328642;
  }

  .primary {
    width: 100%;
    min-height: 3rem;
    margin-top: 0.5rem;
    font: inherit;
    font-size: 0.9rem;
    color: #fff;
    background: #1989fa;
    border: 0;
    border-radius: 0.75rem;
  }

  .primary:disabled {
    opacity: 0.5;
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    overflow: hidden;
    white-space: nowrap;
    clip-path: inset(50%);
  }

  :is(button, a, input):focus-visible {
    outline: 2px solid #1989fa;
    outline-offset: 2px;
  }
</style>

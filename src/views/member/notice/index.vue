<template>
  <main class="notice-settings">
    <header
      ><h1>{{ copy.title }}</h1
      ><p>{{ copy.intro }}</p></header
    >
    <p v-if="!status.supported" role="status">{{ copy.unsupported }}</p>
    <p v-else-if="!status.configured || (setting && !setting.available)" role="status">{{ copy.unavailable }}</p>
    <section v-if="status.supported" class="settings-card">
      <p>{{ status.permission === 'unavailable' ? copy.permissionUnavailable : copy[status.permission] }}</p>
      <p>{{ registered ? copy.registered : copy.unregistered }}</p>
      <nut-button
        v-if="status.permission === 'notDetermined' || (!registered && ['authorized', 'provisional'].includes(status.permission))"
        data-test="push-enable-device"
        :disabled="busy"
        @click="requestPermission"
        >{{ copy.permission }}</nut-button
      >
      <nut-button :disabled="busy" @click="openSettings">{{ copy.settings }}</nut-button>
    </section>
    <p v-if="error" role="alert">{{ error }}</p
    ><p v-if="message" role="status">{{ message }}</p>
    <section v-if="setting" class="settings-card">
      <label v-for="key in preferenceKeys" :key="key" class="enabled-row"
        ><span>{{ copy[key] }}</span
        ><input v-model="setting[key]" type="checkbox" role="switch" :data-test="key" :disabled="busy"
      /></label>
      <p>{{ copy.soundHelp }}</p>
      <div class="actions">
        <nut-button data-test="push-save" block color="#101010" :disabled="busy" @click="save">{{ copy.save }}</nut-button>
        <nut-button data-test="push-test" block plain :disabled="busy || !canTest" @click="sendTest">{{ copy.test }}</nut-button>
      </div>
    </section>
    <section class="settings-card">
      <h2>{{ copy.devices }}</h2
      ><p v-if="!devices.length">{{ copy.none }}</p>
      <div v-for="device in devices" :key="device.installationId" class="device-row"
        ><span
          >{{ device.platform }} · {{ device.appVersion }}
          <small v-if="device.installationId === status.installationId">({{ copy.current }})</small></span
        ><span data-test="push-device-state">{{ device.enabled ? copy.deviceEnabled : copy.deviceDisabled }}</span
        ><nut-button :disabled="busy || !device.enabled" @click="revoke(device.installationId)">{{ copy.revoke }}</nut-button></div
      >
    </section>
    <nut-button :disabled="busy" data-test="push-refresh" @click="load">{{ copy.refresh }}</nut-button>
  </main>
</template>
<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import {
    getPushDevices,
    getPushSettings,
    revokePushDevice,
    savePushSettings,
    testPush,
    type PushDevice,
    type PushSettings,
  } from '@/api/push';
  import {
    pushGetStatus,
    pushOpenSettings,
    pushRequestPermission,
    pushSyncSession,
    pushClearSession,
    unsupportedPush,
  } from '@/mobile/bridge';
  import { displayTimeZone } from '@/mobile/app-context';
  import { useUserStore } from '@/store/modules/user';
  import { pushCopy } from './push-copy';
  import { pushLocale } from '@/api/push';
  const { locale } = useI18n();
  const copy = computed(() => pushCopy[locale.value as keyof typeof pushCopy] || pushCopy['en-us']);
  const user = useUserStore();
  const setting = ref<PushSettings | null>(null);
  const devices = ref<PushDevice[]>([]);
  const status = ref({ ...unsupportedPush });
  const registered = computed(
    () =>
      status.value.registered && devices.value.some((device) => device.installationId === status.value.installationId && device.enabled),
  );
  const busy = ref(false);
  const error = ref('');
  const message = ref('');
  const preferenceKeys = ['enabled', 'tradeSucceeded', 'tradeFailed', 'planAlerts', 'systemAlerts', 'soundEnabled'] as const;
  const canTest = computed(
    () =>
      !!(
        setting.value?.available &&
        setting.value.enabled &&
        registered.value &&
        status.value.installationId &&
        ['authorized', 'provisional'].includes(status.value.permission)
      ),
  );
  async function run(action: () => Promise<void>) {
    if (busy.value) return;
    busy.value = true;
    error.value = '';
    message.value = '';
    try {
      await action();
    } catch {
      error.value = copy.value.failed;
    } finally {
      busy.value = false;
    }
  }
  async function sync() {
    if (user.token && user.info.id)
      status.value = await pushSyncSession({
        accessToken: user.token,
        userId: String(user.info.id),
        locale: pushLocale(locale.value),
        timezone: displayTimeZone(),
      });
  }
  function load() {
    return run(async () => {
      const [prefs, native] = await Promise.all([getPushSettings(), pushGetStatus()]);
      setting.value = prefs;
      status.value = native;
      if (native.supported) await sync();
      // Read after synchronization; the server may retain a remote-revocation tombstone.
      devices.value = await getPushDevices();
    });
  }
  function save() {
    return run(async () => {
      if (!setting.value) return;
      const { available: _available, deviceCount: _deviceCount, ...preferences } = setting.value;
      setting.value = await savePushSettings({ ...preferences, locale: pushLocale(locale.value), timezone: displayTimeZone() });
      message.value = copy.value.saved;
    });
  }
  function requestPermission() {
    return run(async () => {
      status.value = await pushRequestPermission();
      if (status.value.error) throw new Error();
      await sync();
      devices.value = await getPushDevices();
    });
  }
  function openSettings() {
    return run(async () => {
      if (!(await pushOpenSettings()).opened) throw new Error();
    });
  }
  function sendTest() {
    return run(async () => {
      if (!canTest.value || !status.value.installationId) return;
      const result = await testPush(status.value.installationId);
      if (!result.queued) throw new Error();
      message.value = copy.value.queued;
    });
  }
  function revoke(id: string) {
    return run(async () => {
      await revokePushDevice(id);
      if (id === status.value.installationId) {
        await pushClearSession({ revokeDevice: true });
        status.value = await pushGetStatus();
      }
      devices.value = await getPushDevices();
      message.value = copy.value.removed;
    });
  }
  onMounted(load);
</script>
<style scoped lang="scss">
  .notice-settings {
    padding: 1.25rem;
    color: #333;
  }
  h1 {
    margin: 0;
    font-size: 1.625rem;
    color: #101010;
  }
  h2 {
    font-size: 1.125rem;
  }
  p {
    color: #666;
    font-size: 0.9375rem;
    line-height: 1.5;
  }
  .settings-card {
    margin: 1.5rem 0;
  }
  .enabled-row,
  .device-row {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    padding: 0.75rem 0;
  }
  .device-row span {
    overflow-wrap: anywhere;
  }
  input {
    width: 1.25rem;
    height: 1.25rem;
    accent-color: #101010;
  }
  .actions {
    display: grid;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }
  [role='alert'] {
    color: #b42318;
  }
</style>

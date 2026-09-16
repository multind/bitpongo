<template>
  <main class="notice-settings">
    <header
      ><h1>{{ copy.title }}</h1
      ><p>{{ copy.intro }}</p></header
    >
    <p v-if="!status.supported" role="status">{{ copy.unsupported }}</p>
    <p v-else-if="!status.configured || (setting && !setting.available)" role="status">{{ copy.unavailable }}</p>
    <section v-if="status.supported" class="settings-card">
      <p>{{ permission === 'unavailable' ? copy.permissionUnavailable : copy[permission] }}</p>
      <p>{{ status.registered && !devicesLoaded ? copy.registrationUnknown : registered ? copy.registered : copy.unregistered }}</p>
      <nut-button v-if="canEnableDevice" data-test="push-enable-device" :disabled="busy" @click="requestPermission">{{
        copy.permission
      }}</nut-button>
      <nut-button :disabled="busy" @click="openSettings">{{ copy.settings }}</nut-button>
    </section>
    <p v-if="nativeError" role="alert" data-test="push-native-error">
      {{ copy.errors[nativeError] }} <code>({{ nativeError }})</code>
    </p>
    <section v-if="status.supported || nativeError" class="settings-card push-diagnostics" data-test="push-diagnostics">
      <h2>{{ copy.diagnostics.title }}</h2>
      <p>{{ copy.diagnostics.help }}</p>
      <dl>
        <dt>{{ copy.diagnostics.supported }}</dt
        ><dd>{{ status.supported === true ? copy.yes : copy.no }}</dd> <dt>{{ copy.diagnostics.configured }}</dt
        ><dd>{{ status.configured === true ? copy.yes : copy.no }}</dd> <dt>{{ copy.diagnostics.session }}</dt
        ><dd>{{ user.token && user.info.id ? copy.yes : copy.no }}</dd> <dt>{{ copy.diagnostics.permission }}</dt
        ><dd>{{ permission }}</dd>
        <dt>{{ copy.diagnostics.nativeRegistered }}</dt>
        <dd data-test="push-native-registered">{{ status.registered === true ? copy.yes : copy.no }}</dd>
        <dt>{{ copy.diagnostics.serverRegistered }}</dt>
        <dd data-test="push-server-registered">{{ devicesLoaded ? (serverRegistered ? copy.yes : copy.no) : copy.unknown }}</dd>
      </dl>
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
      ><p v-if="!devicesLoaded">{{ copy.devicesUnavailable }}</p
      ><p v-else-if="!devices.length">{{ copy.none }}</p>
      <div v-for="device in devices" :key="device.installationId" class="device-row"
        ><span
          >{{ device.platform }} · {{ device.appVersion }}
          <small v-if="device.installationId === status.installationId">({{ copy.current }})</small></span
        ><span data-test="push-device-state">{{ device.enabled ? copy.deviceEnabled : copy.deviceDisabled }}</span
        ><nut-button :disabled="busy" @click="revoke(device.installationId)">{{ copy.revoke }}</nut-button></div
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
  const devicesLoaded = ref(false);
  const status = ref({ ...unsupportedPush });
  const permission = computed(() => {
    const value = status.value.permission;
    return ['authorized', 'provisional', 'denied', 'notDetermined'].includes(value) ? value : 'unavailable';
  });
  // Only known codes and scalar status fields are rendered. Never dump bridge
  // payloads, exception messages, credentials, or provider tokens into the page.
  const nativeError = computed(() => {
    const value = status.value.error;
    if (!value) return null;
    return Object.prototype.hasOwnProperty.call(copy.value.errors, value) ? (value as keyof typeof copy.value.errors) : 'unknown_error';
  });
  const serverRegistered = computed(
    () => devicesLoaded.value && devices.value.some((device) => device.installationId === status.value.installationId && device.enabled),
  );
  const registered = computed(() => status.value.registered && serverRegistered.value);
  const canEnableDevice = computed(
    () =>
      permission.value === 'notDetermined' ||
      (['authorized', 'provisional'].includes(permission.value) &&
        (!status.value.registered || (devicesLoaded.value && !serverRegistered.value))),
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
  async function loadDevices() {
    devicesLoaded.value = false;
    devices.value = [];
    devices.value = await getPushDevices();
    devicesLoaded.value = true;
  }
  function load() {
    return run(async () => {
      devicesLoaded.value = false;
      devices.value = [];
      const [prefs, native] = await Promise.allSettled([getPushSettings(), pushGetStatus()]);
      status.value = native.status === 'fulfilled' ? native.value : { ...unsupportedPush, error: 'bridge_unavailable' };
      if (prefs.status === 'fulfilled') setting.value = prefs.value;
      if (status.value.supported) await sync();
      if (prefs.status === 'rejected') throw new Error();
      // Read after synchronization; the server may retain a remote-revocation tombstone.
      await loadDevices();
    });
  }
  function save() {
    return run(async () => {
      if (!setting.value) return;
      setting.value = await savePushSettings({
        enabled: setting.value.enabled,
        tradeSucceeded: setting.value.tradeSucceeded,
        tradeFailed: setting.value.tradeFailed,
        planAlerts: setting.value.planAlerts,
        systemAlerts: setting.value.systemAlerts,
        soundEnabled: setting.value.soundEnabled,
        locale: pushLocale(locale.value),
        timezone: displayTimeZone(),
      });
      message.value = copy.value.saved;
    });
  }
  function requestPermission() {
    return run(async () => {
      status.value = await pushRequestPermission();
      if (status.value.error) return;
      await sync();
      await loadDevices();
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
      await loadDevices();
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
    font-size: 0.9375rem;
    line-height: 1.5;
    color: #666;
  }

  .settings-card {
    margin: 1.5rem 0;
  }

  .push-diagnostics {
    padding: 1rem;
    overflow-wrap: anywhere;
    background: #fafafa;
    border: 1px solid #e5e5e5;
    border-radius: 0.75rem;
  }

  .push-diagnostics dl {
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 0.5rem 1rem;
    font-size: 0.875rem;
  }

  .push-diagnostics dd {
    margin: 0;
    text-align: right;
  }

  code {
    overflow-wrap: anywhere;
  }

  .enabled-row,
  .device-row {
    display: flex;
    gap: 1rem;
    align-items: center;
    justify-content: space-between;
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

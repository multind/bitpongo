<template>
  <main class="alerts-page profile-page">
    <h1 class="page-heading">{{ t('profile.title') }}</h1>
    <Avatar editable />
    <form class="alert-card" @submit.prevent="save">
      <fieldset
        ><legend>{{ t('profile.title') }}</legend>
        <label for="profile-name">{{ t('profile.name') }}</label>
        <input id="profile-name" v-model="form.name" maxlength="50" required :disabled="busy || !canEdit" autocomplete="nickname" />
        <SheetSelect
          id="profile-country"
          v-model="form.country"
          :label="t('profile.country')"
          :options="countryOptions"
          :disabled="busy || !canEdit"
          searchable
        />
        <label for="profile-introduction">{{ t('profile.introduction') }}</label>
        <textarea id="profile-introduction" v-model="form.introduction" maxlength="500" rows="4" :disabled="busy || !canEdit" />
      </fieldset>
      <p v-if="error" role="alert">{{ t('common.saveFailed') }}</p>
      <p v-if="saved" role="status">{{ t('common.saveSuccess') }}</p>
      <footer class="profile-actions">
        <button type="submit" :disabled="busy || !canEdit || !form.name.trim()">{{ busy ? t('common.loading') : t('common.save') }}</button>
        <button v-if="!canEdit && !busy" type="button" @click="load">{{ t('market.retry') }}</button>
      </footer>
    </form>
  </main>
</template>
<script setup lang="ts">
  import Avatar from './Avatar.vue';
  import { computed, onMounted, onUnmounted, ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import { getUserProfile, saveUserProfile, type UserProfile } from '@/api/profile';
  import { useUserStore } from '@/store/modules/user';
  import SheetSelect from '@/components/SheetSelect.vue';
  const { t, locale } = useI18n();
  const countryCodes =
    'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
      ' ',
    );
  const countryOptions = computed(() => {
    let names: Intl.DisplayNames | undefined;
    try {
      names = new Intl.DisplayNames([locale.value], { type: 'region' });
    } catch {
      /* Old WebViews can use ISO codes. */
    }
    return [{ value: '', label: '—' }, ...countryCodes.map((value) => ({ value, label: `${names?.of(value) || value} (${value})` }))];
  });
  const user = useUserStore();
  const form = ref<UserProfile>({ name: '', country: '', introduction: '', upDownColor: 'GREEN_UP' });
  const busy = ref(false),
    loaded = ref(false),
    error = ref(false),
    saved = ref(false);
  const loadedToken = ref('');
  const canEdit = computed(() => loaded.value && !!user.token && loadedToken.value === user.token);
  let mounted = true;
  async function load() {
    if (busy.value) return;
    busy.value = true;
    error.value = false;
    const token = user.token;
    try {
      const profile = await getUserProfile();
      if (!mounted || token !== user.token) return;
      form.value = profile;
      loaded.value = true;
      loadedToken.value = token;
      user.setInfo({ ...user.info, name: profile.name, introduction: profile.introduction, upDownColor: profile.upDownColor });
    } catch {
      if (mounted) error.value = true;
    } finally {
      if (mounted) busy.value = false;
    }
  }
  async function save() {
    if (busy.value || !canEdit.value || !form.value.name.trim()) return;
    busy.value = true;
    error.value = false;
    saved.value = false;
    const token = user.token;
    try {
      const current = await getUserProfile();
      if (!mounted || token !== user.token) return;
      const profile = await saveUserProfile({ ...form.value, upDownColor: current.upDownColor });
      if (!mounted || token !== user.token) return;
      form.value = profile;
      user.setInfo({ ...user.info, name: profile.name, introduction: profile.introduction, upDownColor: profile.upDownColor });
      saved.value = true;
    } catch {
      if (mounted) error.value = true;
    } finally {
      if (mounted) busy.value = false;
    }
  }
  onMounted(load);
  onUnmounted(() => {
    mounted = false;
  });
</script>
<style scoped lang="scss">
  @use '../../alerts/shared.scss';

  .profile-page {
    padding: 1rem 0.75rem;
  }

  h1 {
    margin: 0 0 1.25rem;
    font-size: 1.25rem;
    line-height: 1.4;
  }

  fieldset {
    min-width: 0;
    padding: 0;
    margin: 0;
    border: 0;
  }

  legend {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    clip-path: inset(50%);
  }

  form.alert-card {
    padding: 1.25rem;
  }

  label {
    margin: 1.25rem 0 0.5rem;
    font-size: 0.875rem;
    line-height: 1.5;
  }

  label:first-of-type {
    margin-top: 0;
  }

  input,
  textarea,
  select {
    min-height: 2.75rem;
    border-color: #e2e2e2;
    border-radius: 0.625rem;
  }

  textarea {
    line-height: 1.6;
    resize: vertical;
  }

  .meta {
    margin: 0.5rem 0;
    color: #666;
  }

  .profile-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.75rem;
    margin-top: 1.5rem;
  }

  .profile-actions button {
    width: 100%;
    min-height: 2.75rem;
    border-radius: 0.625rem;
  }

  .profile-actions button[type='submit'] {
    color: #fff;
    background: #1765cf;
    border-color: #1765cf;
  }
</style>

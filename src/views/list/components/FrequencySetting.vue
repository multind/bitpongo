<template>
  <nut-row>
    <nut-cell :title="t('frequency.title')" @click="click" is-link>
      <template #desc>
        <span style="color: black">{{ strategy.frequency }}</span>
      </template>
    </nut-cell>

    <nut-action-sheet
      v-model:visible="timeRange"
      :title="t('frequency.chooseTitle')"
      :menu-items="menuItems"
      :cancel-txt="t('common.cancel')"
      @choose="choose"
    />

    <TimeZoneSelect :model-value="strategy.schedule_timezone" @update:model-value="updateTimeZone" />

    <!-- 每小时选择器 -->
    <nut-popup v-model:visible="everyHour" position="bottom" round :style="{ height: '40%' }">
      <nut-picker :columns="columnsHourly" :title="t('frequency.hourly')" @cancel="cancel" @confirm="confirmHourly" />
    </nut-popup>

    <!-- 每天选择器 -->
    <nut-popup v-model:visible="everyDay" position="bottom" round :style="{ height: '40%' }">
      <nut-picker :columns="columnsDaily" :title="t('frequency.daily')" @cancel="cancel" @confirm="confirmDaily" />
    </nut-popup>

    <!-- 每周选择器 -->
    <nut-popup v-model:visible="everyWeek" position="bottom" round :style="{ height: '40%' }">
      <nut-picker v-model="valueWeekly" :columns="columnsWeekly" :title="t('frequency.weekly')" @cancel="cancel" @confirm="confirmWeekly" />
    </nut-popup>

    <!-- 每月选择器 -->
    <nut-popup v-model:visible="everyMonth" position="bottom" round :style="{ height: '40%' }">
      <nut-picker :columns="columnsMonthly" :title="t('frequency.monthly')" @cancel="cancel" @confirm="confirmMonthly" />
    </nut-popup>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import { useI18n } from 'vue-i18n';
  import type { Strategy } from '@/views/list/types/strategy.ts';
  import TimeZoneSelect from './TimeZoneSelect.vue';

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'update:strategy', value: Strategy): void;
  }

  const { t } = useI18n();
  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const timeRange = ref(false);
  const everyDay = ref(false);
  const everyWeek = ref(false);
  const everyMonth = ref(false);
  const everyHour = ref(false);
  const weekDays = t('frequency.weekDays').split(',');
  const valueWeekly = ref([weekDays[0], '08:00']);

  const menuItems = [
    {
      name: t('frequency.daily'),
      value: 'daily',
      color: 'green',
      subname: t('frequency.mostChosen'),
    },
    {
      name: t('frequency.weekly'),
      value: 'weekly',
    },
    {
      name: t('frequency.hourly'),
      value: 'hourly',
    },
    {
      name: t('frequency.monthly'),
      value: 'monthly',
    },
  ];

  const dateChoose = [
    { text: '00:00', value: '0' },
    { text: '01:00', value: '1' },
    { text: '02:00', value: '2' },
    { text: '03:00', value: '3' },
    { text: '04:00', value: '4' },
    { text: '05:00', value: '5' },
    { text: '06:00', value: '6' },
    { text: '07:00', value: '7' },
    { text: '08:00', value: '8' },
    { text: '09:00', value: '9' },
    { text: '10:00', value: '10' },
    { text: '11:00', value: '11' },
    { text: '12:00', value: '12' },
    { text: '13:00', value: '13' },
    { text: '14:00', value: '14' },
    { text: '15:00', value: '15' },
    { text: '16:00', value: '16' },
    { text: '17:00', value: '17' },
    { text: '18:00', value: '18' },
    { text: '19:00', value: '19' },
    { text: '20:00', value: '20' },
    { text: '21:00', value: '21' },
    { text: '22:00', value: '22' },
    { text: '23:00', value: '23' },
  ];

  const columnsDaily = ref(dateChoose);

  const columnsWeekly = ref([weekDays.map((name, index) => ({ text: name, value: String(index + 1) })), dateChoose]);

  const columnsMonthly = ref([
    Array.from({ length: 28 }, (_, index) => ({
      text: t('frequency.dayOfMonth', { day: index + 1 }),
      value: String(index + 1),
    })),
    dateChoose,
  ]);

  const columnsHourly = ref([
    [1, 4, 8, 12].map((interval) => ({
      text: t('frequency.hourInterval', { interval }),
      value: String(interval),
    })),
    dateChoose,
  ]);

  const click = () => {
    timeRange.value = true;
  };

  const choose = (item: { value: any }) => {
    timeRange.value = false;
    switch (item.value) {
      case 'daily':
        everyDay.value = true;
        break;
      case 'weekly':
        everyWeek.value = true;
        break;
      case 'hourly':
        everyHour.value = true;
        break;
      case 'monthly':
        everyMonth.value = true;
        break;
    }
  };

  const cancel = () => {
    everyDay.value = false;
    everyWeek.value = false;
    everyHour.value = false;
    everyMonth.value = false;
    timeRange.value = true;
  };

  const updateTimeZone = (scheduleTimezone: string) => {
    emit('update:strategy', { ...props.strategy, schedule_timezone: scheduleTimezone });
  };

  const confirmDaily = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    everyDay.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: t('frequency.dailyPattern', { time: selectedOptions[0].text }),
      cron: generateCronExpression('daily', selectedValue),
    };
    emit('update:strategy', updatedStrategy);
  };

  const confirmWeekly = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    console.log('weekly:', selectedOptions);
    everyWeek.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: t('frequency.weeklyPattern', { day: selectedOptions[0].text, time: selectedOptions[1].text }),
      cron: generateCronExpression('weekly', selectedValue),
    };
    emit('update:strategy', updatedStrategy);
  };

  const confirmHourly = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    everyHour.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: t('frequency.hourlyPattern', { interval: selectedOptions[0].text, time: selectedOptions[1].text }),
      cron: generateCronExpression('hourly', selectedValue),
    };
    emit('update:strategy', updatedStrategy);
  };

  const confirmMonthly = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    everyMonth.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: t('frequency.monthlyPattern', { day: selectedOptions[0].text, time: selectedOptions[1].text }),
      cron: generateCronExpression('monthly', selectedValue),
    };
    emit('update:strategy', updatedStrategy);
  };

  const generateCronExpression = (type: string, selectedValue: string[]) => {
    switch (type) {
      case 'daily':
        return `0 ${selectedValue[0]} * * *`;
      case 'weekly':
        return `0 ${selectedValue[1]} * * ${selectedValue[0]}`;
      case 'monthly':
        return `0 ${selectedValue[1]} ${selectedValue[0]} * *`;
      case 'hourly':
        console.log('cron:', generateFixedCycleCron(Number(selectedValue[1]), Number(selectedValue[0])));
        return generateFixedCycleCron(Number(selectedValue[1]), Number(selectedValue[0]));
      default:
        return '';
    }
  };

  /**
   * 根据起始小时和间隔生成 Linux Cron 表达式
   * 适用间隔：1, 4, 8, 12 (均能整除 24，每天执行点固定)
   */
  function generateFixedCycleCron(startHour: number, interval: number): string {
    const allowedIntervals = [1, 4, 8, 12];
    if (startHour < 0 || startHour > 23) {
      throw new Error('起始小时必须在 0-23 之间');
    }
    if (!allowedIntervals.includes(interval)) {
      throw new Error('请选择有效的间隔：1, 4, 8, 12');
    }

    const hours: number[] = [];
    const timesPerDay = 24 / interval;

    for (let i = 0; i < timesPerDay; i++) {
      const nextHour = (startHour + i * interval) % 24;
      hours.push(nextHour);
    }

    hours.sort((a, b) => a - b);

    return `0 ${hours.join(',')} * * *`;
  }
</script>

<template>
  <nut-row>
    <nut-cell title="定投频率" @click="click" is-link>
      <template #desc>
        <span style="color: black">{{ strategy.frequency }}</span>
      </template>
    </nut-cell>

    <nut-action-sheet v-model:visible="timeRange" title="选择定投频率" :menu-items="menuItems" cancel-txt="取消" @choose="choose" />

    <!-- 每小时选择器 -->
    <nut-popup v-model:visible="everyHour" position="bottom" round :style="{ height: '40%' }">
      <nut-picker :columns="columnsHourly" title="每小时" @cancel="cancel" @confirm="confirmHourly" />
    </nut-popup>

    <!-- 每天选择器 -->
    <nut-popup v-model:visible="everyDay" position="bottom" round :style="{ height: '40%' }">
      <nut-picker :columns="columnsDaily" title="每天" @cancel="cancel" @confirm="confirmDaily" />
    </nut-popup>

    <!-- 每周选择器 -->
    <nut-popup v-model:visible="everyWeek" position="bottom" round :style="{ height: '40%' }">
      <nut-picker v-model="valueWeekly" :columns="columnsWeekly" title="每周" @cancel="cancel" @confirm="confirmWeekly" />
    </nut-popup>

    <!-- 每月选择器 -->
    <nut-popup v-model:visible="everyMonth" position="bottom" round :style="{ height: '40%' }">
      <nut-picker :columns="columnsMonthly" title="每月" @cancel="cancel" @confirm="confirmMonthly" />
    </nut-popup>
  </nut-row>
</template>

<script setup lang="ts">
  import { ref } from 'vue';
  import type { Strategy } from '@/views/list/types/strategy.ts';

  interface Props {
    strategy: Strategy;
  }

  interface Emits {
    (e: 'update:strategy', value: Strategy): void;
  }

  const props = defineProps<Props>();
  const emit = defineEmits<Emits>();

  const timeRange = ref(false);
  const everyDay = ref(false);
  const everyWeek = ref(false);
  const everyMonth = ref(false);
  const everyHour = ref(false);
  const valueWeekly = ref(['周一', '08:00']);

  const menuItems = [
    {
      name: '每天',
      value: 'daily',
      color: 'green',
      subname: '最多选择',
    },
    {
      name: '每周',
      value: 'weekly',
    },
    {
      name: '每小时',
      value: 'hourly',
    },
    {
      name: '每月',
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

  const columnsWeekly = ref([
    [
      { text: '周一', value: '1' },
      { text: '周二', value: '2' },
      { text: '周三', value: '3' },
      { text: '周四', value: '4' },
      { text: '周五', value: '5' },
      { text: '周六', value: '6' },
      { text: '周日', value: '7' },
    ],
    dateChoose,
  ]);

  const columnsMonthly = ref([
    [
      { text: '1 号', value: '1' },
      { text: '2 号', value: '2' },
      { text: '3 号', value: '3' },
      { text: '4 号', value: '4' },
      { text: '5 号', value: '5' },
      { text: '6 号', value: '6' },
      { text: '7 号', value: '7' },
      { text: '8 号', value: '8' },
      { text: '9 号', value: '9' },
      { text: '10 号', value: '10' },
      { text: '11 号', value: '11' },
      { text: '12 号', value: '12' },
      { text: '13 号', value: '13' },
      { text: '14 号', value: '14' },
      { text: '15 号', value: '15' },
      { text: '16 号', value: '16' },
      { text: '17 号', value: '17' },
      { text: '18 号', value: '18' },
      { text: '19 号', value: '19' },
      { text: '20 号', value: '20' },
      { text: '21 号', value: '21' },
      { text: '22 号', value: '22' },
      { text: '23 号', value: '23' },
      { text: '24 号', value: '24' },
      { text: '25 号', value: '25' },
      { text: '26 号', value: '26' },
      { text: '27 号', value: '27' },
      { text: '28 号', value: '28' },
    ],
    dateChoose,
  ]);

  const columnsHourly = ref([
    [
      { text: '1 小时', value: '1' },
      { text: '4 小时', value: '4' },
      { text: '8 小时', value: '8' },
      { text: '12 小时', value: '12' },
    ],
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

  const confirmDaily = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    everyDay.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: '每天 ' + selectedOptions[0].text,
      cron: generateCronExpression('daily', selectedValue),
    };
    emit('update:strategy', updatedStrategy);
  };

  const confirmWeekly = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    console.log('weekly:', selectedOptions);
    everyWeek.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: '每周 ' + selectedOptions[0].text + ' ' + selectedOptions[1].text,
      cron: generateCronExpression('weekly', selectedValue),
    };
    emit('update:strategy', updatedStrategy);
  };

  const confirmHourly = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    everyHour.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: '每 ' + selectedOptions[0].text + ' ' + selectedOptions[1].text,
      cron: generateCronExpression('hourly', selectedValue),
    };
    emit('update:strategy', updatedStrategy);
  };

  const confirmMonthly = ({ selectedValue, selectedOptions }: { selectedValue: string[]; selectedOptions: any[] }) => {
    everyMonth.value = false;
    const updatedStrategy = {
      ...props.strategy,
      frequency: '每月 ' + selectedOptions[0].text + ' ' + selectedOptions[1].text,
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
   *
   * 代码逻辑要点：
   * 1. 确定执行次数：由于 24 / interval 永远是整数，我们直接循环这个次数即可找全一天中所有的点。
   * 2. 取模运算 (% 24)：这是处理“跨天”的核心。例如 23+8=31，通过 31 / 24 取余数得到 7，自动算出了第二天的凌晨时间。
   * 3. 自动排序：Linux Cron 规范虽然允许乱序，但标准写法是从小到大（如 3,15 而不是 15,3），代码中加入了 .sort()。
   * 4. 无偏移性：正如前文分析，由于这四个间隔都能整除 24，生成的表达式每天都会在相同的时间点触发，逻辑非常稳健。
   *
   * @param startHour 起始小时 (0-23)
   * @param interval 时间间隔 (1, 4, 8, 12)
   * @returns 完整的 Cron 字符串，例如 "0 7,15,23 * * *"
   */
  function generateFixedCycleCron(startHour: number, interval: number): string {
    // 1. 参数校验
    const allowedIntervals = [1, 4, 8, 12];
    if (startHour < 0 || startHour > 23) {
      throw new Error('起始小时必须在 0-23 之间');
    }
    if (!allowedIntervals.includes(interval)) {
      throw new Error('请选择有效的间隔：1, 4, 8, 12');
    }

    const hours: number[] = [];

    // 2. 逻辑计算：
    // 因为间隔能整除 24，所以一天内执行的次数是固定的 (24 / interval)
    const timesPerDay = 24 / interval;

    for (let i = 0; i < timesPerDay; i++) {
      // 计算每个执行点，并使用 % 24 确保在 0-23 范围内循环
      const nextHour = (startHour + i * interval) % 24;
      hours.push(nextHour);
    }

    // 3. 排序：Cron 的小时字段建议从小到大排列
    hours.sort((a, b) => a - b);

    // 4. 格式化为 Cron 字符串 (分钟设为 0，匹配每天)
    return `0 ${hours.join(',')} * * *`;
  }
</script>

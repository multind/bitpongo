import { i18n } from '@/i18n';
import { displayTimeZone } from '@/mobile/app-context';
import { DateTime } from 'luxon';

const ABSOLUTE_TIMESTAMP = /(Z|[+-]\d{2}:\d{2})$/;

export function parseInstant(value: string): DateTime {
  if (!ABSOLUTE_TIMESTAMP.test(value)) {
    throw new Error('Absolute timestamp requires Z or an explicit offset');
  }
  const parsed = DateTime.fromISO(value, { setZone: true });
  if (!parsed.isValid) {
    throw new Error(`Invalid timestamp: ${value}`);
  }
  return parsed;
}

export function formatInstant(value: string, zone = displayTimeZone()): string {
  const zoned = parseInstant(value).setZone(zone);
  if (!zoned.isValid) {
    throw new Error(`Invalid time zone: ${zone}`);
  }
  return zoned.toFormat('yyyy-LL-dd HH:mm');
}

export function formatScheduleInstant(value: string, scheduleZone: string, displayZone: string): { primary: string; secondary?: string } {
  const primary = `${formatInstant(value, scheduleZone)} ${scheduleZone}`;
  if (scheduleZone === displayZone) {
    return { primary };
  }
  return {
    primary,
    secondary: `${formatInstant(value, displayZone)} ${displayZone}`,
  };
}

/**
 * 计算从创建时间到当前时间的运行时长
 * @param createdAt 创建时间字符串
 * @returns 格式化的运行时长文本
 */
export function calculateRunTime(createdAt?: string): string {
  if (!createdAt) {
    return i18n.global.t('common.runningFor', { days: 0, hours: 0, minutes: 0 });
  }

  try {
    const createdTime = parseInstant(createdAt).toMillis();
    const currentTime = Date.now();
    const diffMs = currentTime - createdTime;

    if (diffMs < 0) {
      return i18n.global.t('common.runningFor', { days: 0, hours: 0, minutes: 0 });
    }

    // 计算天数、小时数、分钟数
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return i18n.global.t('common.runningFor', { days, hours, minutes });
  } catch (error) {
    console.error('计算运行时间出错:', error);
    return i18n.global.t('common.runningFor', { days: 0, hours: 0, minutes: 0 });
  }
}

/**
 * 格式化时间字符串 YYYY-MM-DDTHH:mm:ss 为 YYYY-MM-DD HH:mm
 * @param timeStr 时间字符串
 * @returns 格式化后的时间
 */
export function formatDateTime(timeStr?: string): string {
  if (!timeStr) {
    return '';
  }

  try {
    return formatInstant(timeStr);
  } catch (error) {
    console.error('格式化时间出错:', error);
    return timeStr; // 返回原始字符串作为后备
  }
}

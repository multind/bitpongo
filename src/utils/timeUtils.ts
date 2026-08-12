/**
 * 计算从创建时间到当前时间的运行时长
 * @param createdAt 创建时间字符串
 * @returns 格式化的运行时长文本
 */
export function calculateRunTime(createdAt?: string): string {
  if (!createdAt) {
    return '已运行 0 天 0 时 0 分';
  }

  try {
    const createdTime = new Date(createdAt).getTime();
    const currentTime = Date.now();
    const diffMs = currentTime - createdTime;

    if (diffMs < 0) {
      return '已运行 0 天 0 时 0 分';
    }

    // 计算天数、小时数、分钟数
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    return `已运行 ${days} 天 ${hours} 时 ${minutes} 分`;
  } catch (error) {
    console.error('计算运行时间出错:', error);
    return '已运行 0 天 0 时 0 分';
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
    const date = new Date(timeStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}`;
  } catch (error) {
    console.error('格式化时间出错:', error);
    return timeStr; // 返回原始字符串作为后备
  }
}

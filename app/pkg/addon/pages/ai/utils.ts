/**
 * 格式化时间戳为可读的时间字符串
 */
export const formatTime = (timestamp: number): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  // 如果是今天
  if (diff < 24 * 60 * 60 * 1000 && now.getDate() === date.getDate()) {
    const hours = date.getHours().toString().padStart(2, "0");
    const minutes = date.getMinutes().toString().padStart(2, "0");

    return `${hours}:${minutes}`;
  }

  // 如果是昨天
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

  if (date.getDate() === yesterday.getDate()) {
    return "昨天";
  }

  // 其他情况显示日期
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const day = date.getDate().toString().padStart(2, "0");

  return `${month}-${day}`;
};

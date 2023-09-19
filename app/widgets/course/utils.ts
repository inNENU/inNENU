import { DAY } from "../../utils/constant.js";

export const getCurrentTime = (): string => {
  const date = new Date();

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;

  if (currentMonth > 2 && currentMonth < 8)
    return `${currentYear - 1}-${currentYear}-2`;
  if (currentMonth > 7) return `${currentYear}-${currentYear + 1}-1`;

  return `${currentYear - 1}-${currentYear}-1`;
};

export const getWeekIndex = (startTime: string, maxWeek: number): number => {
  const passedWeeks = Math.floor(
    (Date.now() - Date.parse(startTime)) / DAY / 7,
  );

  return passedWeeks >= 0 && passedWeeks + 1 <= maxWeek ? passedWeeks + 1 : 0;
};

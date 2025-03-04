import { DAY } from "../config/index.js";

export const getCurrentTimeCode = (): string => {
  const date = new Date();

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;

  if (currentMonth >= 2 && currentMonth < 8) return `${currentYear - 1}02`;
  if (currentMonth > 7) return `${currentYear}01`;

  return `${currentYear - 1}01`;
};

export const getWeekIndex = (startTime: string, maxWeek: number): number => {
  const passedWeeks = Math.floor(
    (Date.now() - Date.parse(startTime)) / DAY / 7,
  );

  return passedWeeks >= 0 && passedWeeks + 1 <= maxWeek ? passedWeeks + 1 : 0;
};

export const getWeekName = (weeks: number[], maxWeek: number): string => {
  let weekName = `${weeks.join("、")}周`;

  if (weeks.length === maxWeek) {
    weekName = "每周";
  } else if (
    weeks[0] === 1 &&
    weeks[weeks.length - 1] === (maxWeek % 2 === 0 ? maxWeek - 1 : maxWeek) &&
    weeks.every((week) => week % 2 === 1)
  ) {
    weekName = "单周";
  } else if (
    weeks[0] === 2 &&
    weeks[weeks.length - 1] === (maxWeek % 2 === 0 ? maxWeek : maxWeek - 1) &&
    weeks.every((week) => week % 2 === 0)
  ) {
    weekName = "双周";
  }

  return weekName;
};

import { $Page } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { type ClassItem, type TableItem, getCourseTable } from "./api.js";
import { modal } from "../../utils/api.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { appCoverPrefix } from "../../utils/config.js";
import { DAY, MONTH } from "../../utils/constant.js";
import { popNotice } from "../../utils/page.js";

export type WeekRange = [number, number];

export interface ClassData {
  name: string;
  teacher: string;
  time: string;
  location: string;
  weeks: WeekRange[];
}

export type CellData = ClassData[];
export type RowData = CellData[];
export type TableData = RowData[];

interface CourseTableData {
  courseData: TableData;
  weeks: number;
  startTime: string;
}

const PAGE_ID = "course-table";
const PAGE_TITLE = "课程表";

const date = new Date();

const currentYear = date.getFullYear();
const currentMonth = date.getMonth() + 1;

const getCurrentTime = (): string => {
  if (currentMonth > 2 && currentMonth < 8)
    return `${currentYear - 1}-${currentYear}-2`;
  if (currentMonth > 7) return `${currentYear}-${currentYear + 1}-1`;

  return `${currentYear - 1}-${currentYear}-1`;
};

const getTimes = (grade: number): string[] => {
  const currentYear = new Date().getFullYear();
  const times: string[] = [];

  for (let i = grade; i < currentYear; i++)
    times.push(`${i}-${i + 1}-1`, `${i}-${i + 1}-2`);

  times.push(`${currentYear}-${currentYear + 1}-1`);
  if (currentMonth > 7) times.push(`${currentYear}-${currentYear + 1}-2`);

  return times.reverse();
};

const getDisplayTime = (time: string): string => {
  const [startYear, endYear, semester] = time.split("-");

  return semester === "1" ? `${startYear}年秋季学期` : `${endYear}年春季学期`;
};

const getWeekRange = (timeText: string): WeekRange[] => {
  const match = /([\d,-]+)周/.exec(timeText);

  return match
    ? match[1].split(",").map((item) => {
        const range = item.split("-");

        if (range.length === 1) range.push(range[0]);

        return range.map((str) => Number.parseInt(str, 10)) as WeekRange;
      })
    : [];
};

const handleCourseTable = (
  courseTable: TableItem,
  startTime: string
): CourseTableData => {
  let weeks = 0;

  const courseData = courseTable.map((row) =>
    row.map((cell) =>
      cell.map((item) => {
        const courseWeeks = getWeekRange(item.time);

        if (courseWeeks.length > 0)
          weeks = Math.max(courseWeeks[courseWeeks.length - 1][1], weeks);

        return { ...item, weeks: courseWeeks };
      })
    )
  );

  return { courseData, weeks, startTime };
};

$Page(PAGE_ID, {
  data: {
    courseData: <TableData>[],
    times: <string[]>[],
    timeIndex: 0,
    weeks: 0,
    weekIndex: 0,
  },

  state: {
    accountInfo: <AccountBasicInfo>{},
    coursesDataInfo: <Record<string, CourseTableData>>{},
    grade: new Date().getFullYear(),
  },

  onShow() {
    const accountInfo = get<AccountBasicInfo>("account-info");
    const coursesDataInfo =
      get<Record<string, CourseTableData>>("course-data-info");

    if (coursesDataInfo) this.state.coursesDataInfo = coursesDataInfo;

    if (!accountInfo) {
      modal("请先登录", "暂无账号信息，请输入", (): void => {
        this.$go("account?update=true");
      });
    } else {
      const grade = Math.floor(accountInfo.id / 1000000);
      const times = getTimes(grade);
      const timeDisplays = times.map(getDisplayTime);
      const time = getCurrentTime();
      const timeIndex = times.indexOf(time);

      this.state.accountInfo = accountInfo;

      if (coursesDataInfo && coursesDataInfo[time]) {
        const { courseData, weeks, startTime } = coursesDataInfo[time];

        // the first one is all courses
        const passedWeeks = Math.ceil(
          (new Date().getTime() - new Date(startTime).getTime()) / DAY / 7
        );

        this.setData({
          courseData,
          weeks,
          times,
          timeDisplays,
          timeIndex,
          weekIndex: passedWeeks >= 0 && passedWeeks <= weeks ? passedWeeks : 0,
        });
      } else {
        this.setData({
          times,
          timeDisplays,
          timeIndex,
        });
        void this.getCourseData(time);
      }
    }

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/course/table",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  getCourseData(time: string) {
    const { accountInfo } = this.state;

    wx.showLoading({ title: "获取中" });

    return getCourseTable({ ...accountInfo, time }).then((res) => {
      wx.hideLoading();
      if (res.status === "success") {
        const { data, startTime } = res;
        const courseTable = handleCourseTable(data, startTime);
        // the first one is all courses
        const passedWeeks = Math.ceil(
          (new Date().getTime() - new Date(startTime).getTime()) / DAY / 7
        );

        this.setData({
          courseData: courseTable.courseData,
          weeks: courseTable.weeks,
          weekIndex:
            passedWeeks >= 0 && passedWeeks <= courseTable.weeks
              ? passedWeeks
              : 0,
        });
        this.state.coursesDataInfo[time] = courseTable;
        set("course-data-info", this.state.coursesDataInfo, 6 * MONTH);
      } else modal("获取失败", res.msg);
    });
  },

  changeTime({ detail }: WechatMiniprogram.PickerChange) {
    const newTimeIndex = Number(detail.value);
    const { times, timeIndex } = this.data;
    const { coursesDataInfo } = this.state;

    if (newTimeIndex !== timeIndex) {
      const newTime = times[newTimeIndex];

      if (coursesDataInfo[newTime]) {
        const { courseData, weeks } = coursesDataInfo[newTime];

        this.setData({
          courseData,
          timeIndex,
          weeks,
          weekIndex: 0,
        });
      } else this.getCourseData(newTime);
    }
  },

  changeWeek({ detail }: WechatMiniprogram.PickerChange) {
    this.setData({
      weekIndex: Number(detail.value),
    });
  },

  refreshCourseTable() {
    const { times, timeIndex } = this.data;
    const time = times[timeIndex];

    return this.getCourseData(time);
  },

  showClassInfo({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    {
      row: number;
      column: number;
      cell: number;
      class: ClassItem;
    }
  >) {
    const { class: classInfo } = currentTarget.dataset;

    const { name, teacher, location } = classInfo;

    modal(name, `教师: ${teacher}\n\n地点:${location}`);
  },
});

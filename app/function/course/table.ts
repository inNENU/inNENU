import { $Page } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { getCourseTable, getUnderSystemCookies } from "./api.js";
import { type ClassItem, type TableItem } from "./typings.js";
import { showModal } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import {
  type CourseTableData,
  type TableData,
  type WeekRange,
} from "../../components/today-course/typings.js";
import { getCurrentTime } from "../../components/today-course/utils.js";
import { appCoverPrefix } from "../../config/info.js";
import { COURSE_DATA_KEY } from "../../config/keys.js";
import { DAY, MONTH } from "../../utils/constant.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "course-table";
const PAGE_TITLE = "课程表";

const getTimes = (grade: number): string[] => {
  const date = new Date();

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
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
  const match = /([\d,-]+)[^\d]*周/.exec(timeText);

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
  startTime: string,
): CourseTableData => {
  let weeks = 0;

  const courseData = courseTable.map((row) =>
    row.map((cell) =>
      cell.map((item) => {
        const courseWeeks = getWeekRange(item.time);

        if (courseWeeks.length > 0)
          weeks = Math.max(courseWeeks[courseWeeks.length - 1][1], weeks);

        return { ...item, weeks: courseWeeks };
      }),
    ),
  );

  return { courseData, weeks, startTime };
};

const getWeekIndex = (startTime: string, maxWeek: number): number => {
  const passedWeeks = Math.floor(
    (new Date().getTime() - new Date(startTime).getTime()) / DAY / 7,
  );

  return passedWeeks >= 0 && passedWeeks + 1 <= maxWeek ? passedWeeks + 1 : 0;
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
    coursesData: <Record<string, CourseTableData>>{},
    grade: new Date().getFullYear(),
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      firstPage: getCurrentPages().length === 1,
    });
  },

  onShow() {
    const { account } = globalData;
    const coursesData = get<Record<string, CourseTableData>>(COURSE_DATA_KEY);

    if (coursesData) this.state.coursesData = coursesData;

    if (!account) {
      showModal("请先登录", "暂无账号信息，请输入", (): void => {
        this.$go("account?from=课程表&update=true");
      });
    } else {
      const grade = Math.floor(account.id / 1000000);
      const times = getTimes(grade);
      const timeDisplays = times.map(getDisplayTime);
      const time = getCurrentTime();
      const timeIndex = times.indexOf(time);

      if (coursesData && coursesData[time]) {
        const { courseData, weeks, startTime } = coursesData[time];

        this.setData({
          courseData,
          weeks,
          times,
          timeDisplays,
          timeIndex,
          weekIndex: getWeekIndex(startTime, weeks),
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
    wx.showLoading({ title: "获取中" });

    return getUnderSystemCookies(globalData.account!)
      .then((data) => {
        if (!data.success) throw data.msg;

        return getCourseTable({
          cookies: data.cookies,
          id: globalData.account!.id,
          time,
        }).then((res) => {
          wx.hideLoading();
          if (res.success) {
            const { data, startTime } = res;
            const courseTable = handleCourseTable(data, startTime);
            const { courseData, weeks } = courseTable;

            this.setData({
              courseData,
              weeks,
              weekIndex: getWeekIndex(startTime, weeks),
            });
            this.state.coursesData[time] = courseTable;
            set(COURSE_DATA_KEY, this.state.coursesData, 6 * MONTH);
          } else showModal("获取失败", res.msg);
        });
      })
      .catch((msg: string) => {
        wx.hideLoading();
        showModal("获取失败", msg);
      });
  },

  changeTime({ detail }: WechatMiniprogram.PickerChange) {
    const timeIndex = Number(detail.value);
    const { times, timeIndex: timeOldIndex } = this.data;
    const { coursesData } = this.state;

    if (timeIndex !== timeOldIndex) {
      const newTime = times[timeIndex];

      if (coursesData[newTime]) {
        const { courseData, weeks, startTime } = coursesData[newTime];

        this.setData({
          courseData,
          timeIndex,
          weeks,
          weekIndex: getWeekIndex(startTime, weeks),
        });
      } else {
        this.setData({ timeIndex });
        this.getCourseData(newTime);
      }
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

    const { name, teacher, location, time } = classInfo;

    showModal(name, `教师: ${teacher}\n地点: ${location}\n时间: ${time}`);
  },
});

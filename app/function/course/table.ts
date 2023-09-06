import { $Page, get, set } from "@mptool/all";

import { getPostCourseTable } from "./post-course-table.js";
import type { ClassItem, TableItem } from "./typings.js";
import {
  getOnlineUnderCourseTable,
  getUnderCourseTable,
} from "./under-course-table.js";
import { getDisplayTime } from "./under-grade-list.js";
import { showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import type {
  CourseTableData,
  TableData,
  WeekRange,
} from "../../components/today-course/typings.js";
import { getCurrentTime } from "../../components/today-course/utils.js";
import { COURSE_DATA_KEY, appCoverPrefix } from "../../config/index.js";
import {
  LoginFailType,
  ensurePostSystemLogin,
  ensureUnderSystemLogin,
} from "../../login/index.js";
import { DAY, MONTH } from "../../utils/constant.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

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

    needLogin: false,
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
    coursesData: <Record<string, CourseTableData>>{},
    grade: new Date().getFullYear(),
    inited: false,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      firstPage: getCurrentPages().length === 1,
    });
  },

  onShow() {
    const { account, userInfo } = globalData;

    if (account) {
      if (!userInfo) {
        return showModal(
          "个人信息缺失",
          "小程序本地暂无个人信息，请重新登录",
          () => {
            this.$go("account?update=true");
          },
        );
      }

      const coursesData = get<Record<string, CourseTableData>>(COURSE_DATA_KEY);

      if (coursesData) this.state.coursesData = coursesData;

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

    this.setData({ needLogin: !globalData.account });

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
    return this[
      globalData.userInfo!.typeId === "bks"
        ? "getUnderCourseData"
        : "getPostCourseData"
    ](time);
  },

  async getUnderCourseData(time: string) {
    wx.showLoading({ title: "获取中" });
    try {
      const err = await ensureUnderSystemLogin(
        globalData.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await (useOnlineService(PAGE_ID)
        ? getOnlineUnderCourseTable
        : getUnderCourseTable)({ time });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        const { data, startTime } = result;
        const courseTable = handleCourseTable(data, startTime);
        const { courseData, weeks } = courseTable;

        this.setData({
          courseData,
          weeks,
          weekIndex: getWeekIndex(startTime, weeks),
        });
        this.state.coursesData[time] = courseTable;
        this.state.loginMethod = "check";
        set(COURSE_DATA_KEY, this.state.coursesData, 6 * MONTH);
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        wx.showModal({
          title: "登录过期",
          content: result.msg,
          confirmText: "重试",
          success: () => {
            this.getUnderCourseData(time);
          },
        });
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
  },

  async getPostCourseData(time: string) {
    wx.showLoading({ title: "获取中" });

    try {
      const err = await ensurePostSystemLogin(
        globalData.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await getPostCourseTable({ time });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        const { data, startTime } = result;
        const courseTable = handleCourseTable(data, startTime);
        const { courseData, weeks } = courseTable;

        this.setData({
          courseData,
          weeks,
          weekIndex: getWeekIndex(startTime, weeks),
        });
        this.state.coursesData[time] = courseTable;
        this.state.loginMethod = "check";
        set(COURSE_DATA_KEY, this.state.coursesData, 6 * MONTH);
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        wx.showModal({
          title: "登录过期",
          content: result.msg,
          confirmText: "重试",
          success: () => {
            this.getPostCourseData(time);
          },
        });
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
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

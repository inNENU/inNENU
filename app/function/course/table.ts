import { $Page, get, set } from "@mptool/all";

import type { ClassItem, TableItem } from "./typings.js";
import { retryAction, showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { COURSE_DATA_KEY, appCoverPrefix } from "../../config/index.js";
import { DAY, MONTH } from "../../config/index.js";
import {
  LoginFailType,
  ensureOnlinePostSystemLogin,
  ensureOnlineUnderSystemLogin,
  ensurePostSystemLogin,
  ensureUnderSystemLogin,
  getOnlinePostCourseTable,
  getOnlineUnderCourseTable,
  getPostCourseTable,
  getUnderCourseTable,
} from "../../service/index.js";
import { info } from "../../state/info.js";
import { user } from "../../state/user.js";
import { getColor, popNotice } from "../../utils/page.js";
import type {
  CourseTableData,
  TableData,
  WeekRange,
} from "../../widgets/course/typings.js";
import { getCurrentTime, getWeekIndex } from "../../widgets/course/utils.js";

const { useOnlineService } = getApp<AppOption>();
const { envName } = info;

const PAGE_ID = "course-table";
const PAGE_TITLE = "课程表";

const getDisplayTime = (time: string): string => {
  const [startYear, endYear, semester] = time.split("-");

  return semester === "1" ? `${startYear}年秋季学期` : `${endYear}年春季学期`;
};

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
  const match = Array.from(timeText.matchAll(/([\d,-]+)[^\d]*周/g));

  return match
    .map(([, time]) =>
      time.split(",").map((item) => {
        const range = item.split("-");

        if (range.length === 1) range.push(range[0]);

        return range.map((str) => Number.parseInt(str, 10)) as WeekRange;
      }),
    )
    .flat();
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

const getDates = (startTime: string, weekIndex: number): string[] => {
  const weekStartTime = Date.parse(startTime) + (weekIndex - 1) * 7 * DAY;

  return [0, 1, 2, 3, 4, 5, 6].map((day) => {
    const date = new Date(weekStartTime + day * DAY);

    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
};

$Page(PAGE_ID, {
  data: {
    courseData: <TableData>[],
    times: <string[]>[],
    timeIndex: 0,
    weeks: 0,
    weekIndex: 0,

    needLogin: false,

    footer: {
      desc: "课表数据使用本地缓存，来源于教学服务系统。如有课程数据变更请自行点击右上角进行刷新。",
    },
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
      theme: info.theme,
    });
  },

  onShow() {
    const { account, info } = user;

    if (account) {
      if (!info) {
        return showModal(
          "个人信息缺失",
          `${envName}本地暂无个人信息，请重新登录`,
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
        const weekIndex = getWeekIndex(startTime, weeks);

        this.setData({
          courseData,
          weeks,
          times,
          timeDisplays,
          timeIndex,
          weekIndex,
          dates: getDates(startTime, weekIndex),
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

    this.setData({ needLogin: !user.account });

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
    const { typeId } = user.info!;

    if (typeId === "bks") return this.getUnderCourseData(time);

    if (typeId === "yjs") return this.getPostCourseData(time);

    return showModal("暂不支持", "课表查询仅支持本科生和研究生。");
  },

  async getUnderCourseData(time: string) {
    wx.showLoading({ title: "获取中" });
    try {
      const err = await (
        useOnlineService("under-login")
          ? ensureOnlineUnderSystemLogin
          : ensureUnderSystemLogin
      )(user.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const result = await (
        useOnlineService(PAGE_ID)
          ? getOnlineUnderCourseTable
          : getUnderCourseTable
      )({ time });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        const { data, startTime } = result;
        const courseTable = handleCourseTable(data, startTime);
        const { courseData, weeks } = courseTable;
        const weekIndex = getWeekIndex(startTime, weeks);

        this.setData({
          courseData,
          weeks,
          weekIndex,
          dates: getDates(startTime, weekIndex),
        });
        this.state.coursesData[time] = courseTable;
        this.state.loginMethod = "check";
        set(COURSE_DATA_KEY, this.state.coursesData, 6 * MONTH);
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        retryAction("登录过期", result.msg, () =>
          this.getUnderCourseData(time),
        );
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
      const err = await (
        useOnlineService("post-login")
          ? ensureOnlinePostSystemLogin
          : ensurePostSystemLogin
      )(user.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const result = await (
        useOnlineService("post-course-table")
          ? getOnlinePostCourseTable
          : getPostCourseTable
      )({ time });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        const { data, startTime } = result;
        const courseTable = handleCourseTable(data, startTime);
        const { courseData, weeks } = courseTable;
        const weekIndex = getWeekIndex(startTime, weeks);

        this.setData({
          courseData,
          weeks,
          weekIndex,
          dates: getDates(startTime, weekIndex),
        });
        this.state.coursesData[time] = courseTable;
        this.state.loginMethod = "check";
        set(COURSE_DATA_KEY, this.state.coursesData, 6 * MONTH);
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        retryAction("登录过期", result.msg, () => this.getPostCourseData(time));
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
        const weekIndex = getWeekIndex(startTime, weeks);

        this.setData({
          courseData,
          timeIndex,
          weeks,
          weekIndex,
          dates: getDates(startTime, weekIndex),
        });
      } else {
        this.setData({ timeIndex });
        this.getCourseData(newTime);
      }
    }
  },

  changeWeek({ detail }: WechatMiniprogram.PickerChange) {
    const weekIndex = Number(detail.value);
    const { times, timeIndex } = this.data;
    const { coursesData } = this.state;

    this.setData({
      weekIndex,
      dates: getDates(coursesData[times[timeIndex]].startTime, weekIndex),
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
    { info: ClassItem }
  >) {
    const { name, teacher, location, time } = currentTarget.dataset.info;

    showModal(name, `教师: ${teacher}\n地点: ${location}\n时间: ${time}`);
  },
});

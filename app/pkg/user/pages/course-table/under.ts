import { $Page, get, set } from "@mptool/all";

import { retryAction, showModal } from "../../../../api/index.js";
import {
  COURSE_DATA_KEY,
  DAY,
  MONTH,
  appCoverPrefix,
} from "../../../../config/index.js";
import type { LoginMethod } from "../../../../service/index.js";
import { ActionFailType } from "../../../../service/index.js";
import type {
  CourseTableClassData,
  CourseTableData,
} from "../../../../state/index.js";
import { envName, info, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type { CourseTableInfo } from "../../../../widgets/course/typings.js";
import {
  getCurrentTimeCode,
  getWeekIndex,
  getWeekName,
} from "../../../../widgets/course/utils.js";
import { getUnderCourseTable } from "../../service/index.js";

const PAGE_ID = "under-course-table";
const PAGE_TITLE = "本科课程表";

const getDisplayTime = (time: string): string => {
  const startYear = Number(time.substring(0, 4));

  return time.endsWith("1")
    ? `${startYear}年秋季学期`
    : `${startYear + 1}年春季学期`;
};

const getTimes = (grade: number): string[] => {
  const date = new Date();

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
  const times: string[] = [];

  for (let i = grade; i < currentYear; i++) times.push(`${i}01`, `${i}02`);

  times.push(`${currentYear}01`);
  if (currentMonth > 7) times.push(`${currentYear}02`);

  return times.reverse();
};

const getMaxWeek = (courseTable: CourseTableData): number =>
  courseTable.reduce(
    (currentMaxWeek, row) =>
      Math.max(
        row.reduce(
          (currentMaxWeek, cell) =>
            Math.max(
              cell.reduce(
                (currentMaxWeek, { weeks }) =>
                  Math.max(currentMaxWeek, weeks[weeks.length - 1]),
                1,
              ),
              currentMaxWeek,
            ),
          1,
        ),
        currentMaxWeek,
      ),
    1,
  );

const getDates = (startTime: string, weekIndex: number): string[] => {
  if (weekIndex === 0) return ["", "", "", "", "", "", ""];

  const weekStartTime = Date.parse(startTime) + (weekIndex - 1) * 7 * DAY;

  return [0, 1, 2, 3, 4, 5, 6].map((day) => {
    const date = new Date(weekStartTime + day * DAY);

    return `${date.getMonth() + 1}/${date.getDate()}`;
  });
};

$Page(PAGE_ID, {
  data: {
    table: [] as CourseTableData,
    maxWeek: 0,

    times: [] as string[],
    timeIndex: 0,
    weekIndex: 0,

    needLogin: false,

    footer: {
      desc: "课表数据使用本地缓存，来源于本科教学服务系统。如有课程数据变更请自行点击右上角进行刷新。",
    },
  },

  state: {
    loginMethod: "validate" as LoginMethod,
    coursesData: {} as Record<string, CourseTableInfo>,
    grade: new Date().getFullYear(),
    inited: false,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
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
            this.$go("account-login?update=true");
          },
        );
      }

      if (info.typeId !== "bks")
        return showModal("暂不支持", "本科课表查询仅允许本科生使用", () => {
          this.$back();
        });

      const coursesData = get<Record<string, CourseTableInfo>>(COURSE_DATA_KEY);

      if (coursesData) this.state.coursesData = coursesData;

      const grade = Math.floor(account.id / 1000000);
      const times = getTimes(grade);
      const timeDisplays = times.map(getDisplayTime);
      const time = getCurrentTimeCode();
      const timeIndex = times.indexOf(time);

      if (coursesData?.[time]) {
        const { table, maxWeek, startTime } = coursesData[time];
        const weekIndex = getWeekIndex(startTime, maxWeek);

        this.setData({
          table,
          maxWeek,
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
        this.getCourseData(time);
      }
    }

    this.setData({ needLogin: !user.account });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getCourseData(time: string) {
    wx.showLoading({ title: "获取中" });

    const result = await getUnderCourseTable(time);

    wx.hideLoading();
    this.state.inited = true;

    if (result.success) {
      const { table, startTime } = result.data;
      const maxWeek = getMaxWeek(table);
      const weekIndex = getWeekIndex(startTime, maxWeek);

      this.setData({
        table,
        maxWeek,
        weekIndex,
        dates: getDates(startTime, weekIndex),
      });
      this.state.coursesData[time] = { table, startTime, maxWeek };
      this.state.loginMethod = "check";
      set(COURSE_DATA_KEY, this.state.coursesData, 6 * MONTH);
    } else if (result.type === ActionFailType.Expired) {
      this.state.loginMethod = "force";
      retryAction("登录过期", result.msg, () => this.getCourseData(time));
    } else {
      showModal("获取失败", result.msg);
    }
  },

  changeTime({ detail }: WechatMiniprogram.PickerChange) {
    const timeIndex = Number(detail.value);
    const { times, timeIndex: timeOldIndex } = this.data;
    const { coursesData } = this.state;

    if (timeIndex !== timeOldIndex) {
      const newTime = times[timeIndex];

      if (coursesData[newTime]) {
        const { table, maxWeek, startTime } = coursesData[newTime];
        const weekIndex = getWeekIndex(startTime, maxWeek);

        this.setData({
          table,
          timeIndex,
          maxWeek,
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
    { info: CourseTableClassData }
  >) {
    const { maxWeek, weekIndex } = this.data;
    const { name, teachers, locations, time, weeks, classIndex } =
      currentTarget.dataset.info;

    let location = Array.from(new Set(locations)).join("，");

    if (weekIndex !== 0) {
      const index = weeks.findIndex((week) => week === weekIndex);

      if (index !== -1) location = locations[index];
    }

    showModal(
      name,
      `教师: ${teachers.join("，")}\n地点: ${location}\n节次:${classIndex[0]}-${classIndex[1]}节\n时间: ${getWeekName(weeks, maxWeek)} ${time}`,
    );
  },
});

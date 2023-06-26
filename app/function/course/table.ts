import { $Page } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { type ClassItem, type TableItem, getCourseTable } from "./api.js";
import { modal } from "../../utils/api.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { appCoverPrefix } from "../../utils/config.js";
import { MONTH } from "../../utils/constant.js";
import { popNotice } from "../../utils/page.js";

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

$Page(PAGE_ID, {
  data: {
    courseTable: <TableItem>[],
    times: <string[]>[],
    index: 0,
  },

  state: {
    accountInfo: <AccountBasicInfo>{},
    courseTableInfo: <Record<string, TableItem>>{},
    grade: new Date().getFullYear(),
  },

  onShow() {
    const accountInfo = get<AccountBasicInfo>("account-info");
    const courseTableInfo = get<Record<string, TableItem>>("course-table-info");

    if (courseTableInfo) this.state.courseTableInfo = courseTableInfo;

    if (!accountInfo) {
      modal("请先登录", "暂无账号信息，请输入", (): void => {
        this.$go("account?update=true");
      });
    } else {
      this.state.accountInfo = accountInfo;
      const grade = Math.floor(accountInfo.id / 1000000);
      const times = getTimes(grade);
      const timeDisplays = times.map(getDisplayTime);
      const time = getCurrentTime();
      const index = times.indexOf(time);

      console.log(grade, times);

      if (courseTableInfo && courseTableInfo[time]) {
        this.setData({
          courseTable: courseTableInfo[time],
          times,
          timeDisplays,
          index,
        });
      } else {
        wx.showLoading({ title: "获取中" });
        void getCourseTable({ ...accountInfo, time }).then((res) => {
          wx.hideLoading();
          if (res.status === "success") {
            this.setData({
              courseTable: res.data,
              times,
              timeDisplays,
              index,
            });
            this.state.courseTableInfo[time] = res.data;
            set("course-table-info", this.state.courseTableInfo, 6 * MONTH);
          } else modal("获取失败", res.msg);
        });
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

  changeTime({ detail }: WechatMiniprogram.PickerChange) {
    const newIndex = Number(detail.value);
    const { times, index } = this.data;
    const { accountInfo, courseTableInfo } = this.state;

    if (newIndex !== index) {
      const newTime = times[newIndex];

      if (courseTableInfo[newTime]) {
        this.setData({
          index: newIndex,
          courseTable: courseTableInfo[newTime],
        });
      } else {
        wx.showLoading({ title: "获取中" });
        getCourseTable({ ...accountInfo, time: newTime }).then((res) => {
          wx.hideLoading();
          if (res.status === "success") {
            this.setData({
              index: newIndex,
              courseTable: res.data,
            });
            this.state.courseTableInfo[newTime] = res.data;
            set("course-table-info", this.state.courseTableInfo, 6 * MONTH);
          } else modal("获取失败", res.msg);
        });
      }
    }
  },

  refreshCourseTable() {
    const { times, index } = this.data;
    const { accountInfo } = this.state;
    const time = times[index];

    wx.showLoading({ title: "获取中" });
    getCourseTable({ ...accountInfo, time }).then((res) => {
      wx.hideLoading();
      if (res.status === "success") {
        this.setData({
          courseTable: res.data,
        });
        this.state.courseTableInfo[time] = res.data;
        set("course-table-info", this.state.courseTableInfo, 6 * MONTH);
      } else modal("获取失败", res.msg);
    });
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

    const { name, teacher, time, location } = classInfo;

    modal(name, `${time}\n教师: ${teacher}\n${location}`);
  },
});

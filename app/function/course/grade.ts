import { $Page } from "@mptool/enhance";

import {
  type GradeResult,
  type UserGradeListExtraOptions,
  getGradeList,
} from "./api.js";
import { type AppOption } from "../../app.js";
import { modal } from "../../utils/api.js";
import { appCoverPrefix } from "../../utils/config.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "grade-list";
const PAGE_TITLE = "成绩查询";
const keys = [
  "name",
  "grade",
  "difficulty",
  "point",
  "gradePoint",
  "shortCourseType",
  "commonType",
  "time",
  "hours",
  "examType",
] as const;

$Page("grade-list", {
  data: {
    grades: <GradeResult[]>[],

    showMark: false,
    showRelearn: false,
    showStatus: false,
    extraHeaders: 0,
    totalPoint: 0,
    totalCommonRequiredPoint: 0,
    totalCommonOptionalPoint: 0,
    totalMajorRequiredPoint: 0,
    totalMajorOptionalPoint: 0,
    totalTeacherRequiredPoint: 0,
    totalTeacherOptionalPoint: 0,
    totalGradePoint: 0,
    gpa: 0,

    sortIndex: 7,
    ascending: false,
  },

  state: {
    numberValueIndex: <number[]>[],
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

    if (!account) {
      modal("请先登录", "暂无账号信息，请输入", (): void => {
        this.$go("account?update=true");
      });
    } else {
      void this.getGradeList();
    }

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/course/grade",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  getGradeList(options: UserGradeListExtraOptions = {}) {
    wx.showLoading({ title: "获取中" });

    return getGradeList({ ...globalData.account!, ...options }).then((res) => {
      wx.hideLoading();
      if (res.status === "success") {
        const { data } = res;
        const showMark = data.some((item) => item.mark);
        const showRelearn = data.some((item) => item.reLearn);
        const showStatus = data.some((item) => item.status);
        const extraHeaders = [showMark, showRelearn, showStatus].filter(
          Boolean
        ).length;
        const totalPoint = data.reduce((total, item) => total + item.point, 0);
        const totalCommonRequiredPoint = data
          .filter((item) => item.shortCourseType === "通修")
          .reduce((total, item) => total + item.point, 0);
        const totalCommonOptionalPoint = data
          .filter((item) => item.shortCourseType === "通选")
          .reduce((total, item) => total + item.point, 0);
        const totalMajorRequiredPoint = data
          .filter((item) => item.shortCourseType === "专修")
          .reduce((total, item) => total + item.point, 0);
        const totalMajorOptionalPoint = data
          .filter((item) => item.shortCourseType === "专选")
          .reduce((total, item) => total + item.point, 0);
        const totalTeacherRequiredPoint = data
          .filter((item) => item.shortCourseType === "师修")
          .reduce((total, item) => total + item.point, 0);
        const totalTeacherOptionalPoint = data
          .filter((item) => item.shortCourseType === "师选")
          .reduce((total, item) => total + item.point, 0);

        const totalGradePoint = data.reduce(
          (total, item) => total + item.gradePoint,
          0
        );
        const gpa = Math.round((totalGradePoint / totalPoint) * 100) / 100;
        const numberValueIndex = keys
          .map((key, index) =>
            data.some((item) => Number.isNaN(Number(item[key]))) ? null : index
          )
          .filter((item): item is number => item !== null);

        this.state.numberValueIndex = numberValueIndex;

        this.setData({
          grades: data,
          showMark,
          showRelearn,
          showStatus,
          extraHeaders,
          totalPoint,
          totalCommonRequiredPoint,
          totalCommonOptionalPoint,
          totalMajorRequiredPoint,
          totalMajorOptionalPoint,
          totalTeacherRequiredPoint,
          totalTeacherOptionalPoint,
          totalGradePoint: Math.round(totalGradePoint * 100) / 100,
          gpa,
        });
      } else modal("获取失败", res.msg);
    });
  },

  sortResults({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { ascending, sortIndex, grades } = this.data;
    const { numberValueIndex } = this.state;

    if (index === sortIndex) {
      this.setData({
        ascending: !ascending,
        grades: grades.reverse(),
      });
    } else {
      const key = keys[index];

      this.setData({
        sortIndex: index,
        grades: grades.sort((itemA, itemB) => {
          if (!itemA[key]) return 1;
          if (!itemB[key]) return -1;

          if (numberValueIndex.includes(index))
            return ascending
              ? Number(itemA[key]) - Number(itemB[key])
              : Number(itemB[key]) - Number(itemA[key]);

          return ascending
            ? (<string>itemA[key])?.localeCompare(<string>itemB[key])
            : (<string>itemB[key])?.localeCompare(<string>itemA[key]);
        }),
      });
    }
  },
});

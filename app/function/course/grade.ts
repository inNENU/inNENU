import { $Page } from "@mptool/enhance";

import { type UserGradeListExtraOptions, getGradeList } from "./api.js";
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
    grades: [
      {
        cid: "RD202200856",
        commonType: "",
        courseType: "任意选修课",
        difficulty: 1,
        examType: "校际交流",
        grade: 86,
        gradePoint: 5.4,
        hours: null,
        mark: "",
        name: "演示物理实验",
        point: 1.5,
        reLearn: "",
        shortCourseType: "",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "1151642015001",
        commonType: "",
        courseType: "通识教育必修课",
        difficulty: 1,
        examType: "期末考试",
        grade: 98,
        gradePoint: 9.6,
        hours: 34,
        mark: "",
        name: "中文写作",
        point: 2,
        reLearn: "",
        shortCourseType: "通修",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "RD202200854",
        commonType: "",
        courseType: "任意选修课",
        difficulty: 1,
        examType: "校际交流",
        grade: 92,
        gradePoint: 8.4,
        hours: null,
        mark: "",
        name: "数学建模2",
        point: 2,
        reLearn: "",
        shortCourseType: "",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "1151712015001",
        commonType: "",
        courseType: "通识教育必修课",
        difficulty: 1,
        examType: "期末考试",
        grade: 86,
        gradePoint: 7.2,
        hours: 34,
        mark: "",
        name: "信息技术1（计算机基础）",
        point: 2,
        reLearn: "",
        shortCourseType: "通修",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "RD202200853",
        commonType: "",
        courseType: "任意选修课",
        difficulty: 1,
        examType: "校际交流",
        grade: 94,
        gradePoint: 8.8,
        hours: null,
        mark: "",
        name: "生活中的高分子材料",
        point: 2,
        reLearn: "",
        shortCourseType: "",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "1151701948001",
        commonType: "",
        courseType: "通识教育必修课",
        difficulty: 1,
        examType: "期末考试",
        grade: 68,
        gradePoint: 10.8,
        hours: 106,
        mark: "",
        name: "高等数学A-1",
        point: 6,
        reLearn: "",
        shortCourseType: "通修",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "1151732015324",
        commonType: "",
        courseType: "专业教育选修课",
        difficulty: 1,
        examType: "期末考试",
        grade: 95,
        gradePoint: 2.25,
        hours: 7,
        mark: "",
        name: "普通物理中的数学方法",
        point: 0.5,
        reLearn: "",
        shortCourseType: "专选",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "1152361982013",
        commonType: "",
        courseType: "通识教育必修课",
        difficulty: 1,
        examType: "期末考试",
        grade: 91,
        gradePoint: 12.3,
        hours: 52,
        mark: "",
        name: "思想道德与法治",
        point: 3,
        reLearn: "",
        shortCourseType: "通修",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "1151671995001",
        commonType: "",
        courseType: "通识教育必修课",
        difficulty: 1,
        examType: "期末考试",
        grade: 72,
        gradePoint: 8.8,
        hours: 70,
        mark: "",
        name: "大学英语读写1",
        point: 4,
        reLearn: "",
        shortCourseType: "通修",
        status: "",
        time: "2022年秋季学期",
      },
      {
        cid: "1151672015005",
        commonType: "人文与艺术",
        courseType: "通识教育选修课",
        difficulty: 1,
        examType: "期末考试",
        grade: 83,
        gradePoint: 6.6,
        hours: 36,
        mark: "",
        name: "实用交际英语口语",
        point: 2,
        reLearn: "",
        shortCourseType: "通选",
        status: "",
        time: "2022年秋季学期",
      },
    ],

    showMark: false,
    showRelearn: false,
    showStatus: false,
    extraHeaders: 0,
    // totalPoint: 0,
    totalPoint: 25,
    // totalGradePoint: 0,
    totalGradePoint: 80.15,
    // gpa: 0,
    gpa: 3.21,

    sortIndex: 0,
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

        console.log(numberValueIndex);

        this.state.numberValueIndex = numberValueIndex;

        this.setData({
          grades: data,
          showMark,
          showRelearn,
          showStatus,
          extraHeaders,
          totalPoint,
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
              ? Number(itemB[key]) - Number(itemA[key])
              : Number(itemA[key]) - Number(itemB[key]);

          return ascending
            ? (<string>itemA[key])?.localeCompare(<string>itemB[key])
            : (<string>itemB[key])?.localeCompare(<string>itemA[key]);
        }),
      });
    }
  },
});

import { $Page } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { courseLogin, getGradeList } from "./api.js";
import { type GradeResult, type UserGradeListExtraOptions } from "./typings.js";
import { showModal } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { GRADE_DATA_KEY } from "../../config/keys.js";
import { HOUR } from "../../utils/constant.js";
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
      showModal("请先登录", "暂无账号信息，请输入", (): void => {
        this.$go("account?update=true");
      });
    } else {
      const grades = get<GradeResult[]>(GRADE_DATA_KEY);

      if (grades) this.setGradeData(grades);
      else void this.getGradeList();
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

    return courseLogin(globalData.account!)
      .then((data) => {
        if (data.status === "failed") throw data.msg;

        return getGradeList({ cookies: data.cookies, ...options }).then(
          (res) => {
            wx.hideLoading();
            if (res.status === "success") {
              set(GRADE_DATA_KEY, res.data, 3 * HOUR);
              this.setGradeData(res.data);
            } else showModal("获取失败", res.msg);
          },
        );
      })
      .catch((msg: string) => {
        wx.hideLoading();
        showModal("获取失败", msg);
      });
  },

  setGradeData(grades: GradeResult[]) {
    const showMark = grades.some((item) => item.mark);
    const showRelearn = grades.some((item) => item.reLearn);
    const showStatus = grades.some((item) => item.status);
    const filteredData = grades.filter((item, index) => {
      const records = grades.filter(
        (record) => record.cid === item.cid && item.grade >= 60,
      );

      return (
        // the max grade
        records.every((record) => record.grade <= item.grade) &&
        // the last one with same grade
        grades.findLastIndex(
          (record) => record.cid === item.cid && record.grade === item.grade,
        ) === index
      );
    });

    const totalPoint = filteredData.reduce(
      (total, item) => total + item.point,
      0,
    );
    const totalCommonRequiredPoint = filteredData
      .filter((item) => item.shortCourseType === "通修")
      .reduce((total, item) => total + item.point, 0);
    const totalCommonOptionalPoint = filteredData
      .filter((item) => item.shortCourseType === "通选")
      .reduce((total, item) => total + item.point, 0);
    const totalMajorRequiredPoint = filteredData
      .filter((item) => item.shortCourseType === "专修")
      .reduce((total, item) => total + item.point, 0);
    const totalMajorOptionalPoint = filteredData
      .filter((item) => item.shortCourseType === "专选")
      .reduce((total, item) => total + item.point, 0);
    const totalTeacherRequiredPoint = filteredData
      .filter((item) => item.shortCourseType === "师修")
      .reduce((total, item) => total + item.point, 0);
    const totalTeacherOptionalPoint = filteredData
      .filter((item) => item.shortCourseType === "师选")
      .reduce((total, item) => total + item.point, 0);

    const totalGradePoint = filteredData.reduce(
      (total, item) => total + item.gradePoint,
      0,
    );
    const gpa = Math.round((totalGradePoint / totalPoint) * 100) / 100;
    const numberValueIndex = keys
      .map((key, index) =>
        grades.some((item) => Number.isNaN(Number(item[key]))) ? null : index,
      )
      .filter((item): item is number => item !== null);

    this.state.numberValueIndex = numberValueIndex;

    this.setData({
      grades: grades,
      showMark,
      showRelearn,
      showStatus,
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

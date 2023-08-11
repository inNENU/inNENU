import { $Page, get, set } from "@mptool/all";

import { getGradeList, getOnlineGradeList } from "./grade-list.js";
import type { GradeResult, UserGradeListOptions } from "./typings.js";
import { showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { GRADE_DATA_KEY, appCoverPrefix } from "../../config/index.js";
import { ensureUnderSystemLogin } from "../../login/index.js";
import { HOUR } from "../../utils/constant.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const PAGE_ID = "course-grade";
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

const getTimes = (grade: number): string[] => {
  const date = new Date();

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
  const times: string[] = [];

  for (let i = grade; i < currentYear - 1; i++)
    times.push(`${i}-${i + 1}-1`, `${i}-${i + 1}-2`);

  times.push(`${currentYear - 1}-${currentYear}-1`);
  if (currentMonth >= 6) times.push(`${currentYear - 1}-${currentYear}-2`);
  if (currentMonth === 12) times.push(`${currentYear}-${currentYear + 1}-1`);

  return times.reverse();
};

const getDisplayTime = (time: string): string => {
  if (time === "") return "全部学期";

  const [startYear, endYear, semester] = time.split("-");

  return semester === "1" ? `${startYear}年秋季学期` : `${endYear}年春季学期`;
};

$Page("course-grade", {
  data: {
    title: PAGE_TITLE,

    grades: <GradeResult[]>[],

    times: <string[]>[],
    timeIndex: 0,

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

    desc: "数据来自教务处本科教学服务系统，请以各学院实际安排与认定为准。",

    needLogin: false,
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
    numberValueIndex: <number[]>[],
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
    if (globalData.account) {
      if (!this.state.inited || this.data.needLogin) {
        const { id } = globalData.account;

        if (id.toString()[4] !== "0")
          return showModal("提示", "目前此功能仅支持本科生", () => {
            this.$back();
          });

        const grade = Math.floor(id / 1000000);
        const times = ["", ...getTimes(grade)];
        const timeDisplays = times.map(getDisplayTime);
        const grades = get<GradeResult[]>(GRADE_DATA_KEY);

        this.setData({ times, timeDisplays });

        if (grades) {
          this.setGradeData(grades);
          this.setStatistics(grades);
        } else {
          this.getGradeList();
        }
      }
    }

    this.setData({ needLogin: !globalData.account });

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

  getGradeList(options: UserGradeListOptions = {}) {
    wx.showLoading({ title: "获取中" });

    return ensureUnderSystemLogin(globalData.account!, "validate")
      .then((err) => {
        if (err) throw err.msg;

        return (useOnlineService(PAGE_ID) ? getOnlineGradeList : getGradeList)(
          options,
        ).then((res) => {
          wx.hideLoading();
          this.state.inited = true;
          if (res.success) {
            set(
              `${GRADE_DATA_KEY}${options.time ? `-${options.time}` : ""}`,
              res.data,
              3 * HOUR,
            );
            this.setGradeData(res.data);
            if (!options.time) this.setStatistics(res.data);
            this.state.loginMethod = "check";
          } else if (res.type === "expired") {
            this.state.loginMethod = "login";
            showModal("登录过期", res.msg);
          } else {
            showModal("获取失败", res.msg);
          }
        });
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
    const numberValueIndex = keys
      .map((key, index) =>
        grades.some((item) => Number.isNaN(Number(item[key]))) ? null : index,
      )
      .filter((item): item is number => item !== null);

    this.state.numberValueIndex = numberValueIndex;

    this.setData({
      grades,
      showMark,
      showRelearn,
      showStatus,
    });
  },

  setStatistics(grades: GradeResult[]) {
    const gradeMap = new Map<string, GradeResult>();

    grades.forEach((item) => {
      if (
        item.grade >= 60 &&
        (!gradeMap.has(item.cid) || item.grade > gradeMap.get(item.cid)!.grade)
      ) {
        gradeMap.set(item.cid, item);
      }
    });

    const filteredData = Array.from(gradeMap.values());

    const totalPoint = filteredData.reduce(
      (total, { point }) => total + point,
      0,
    );
    const totalCommonRequiredPoint = filteredData
      .filter(({ shortCourseType }) => shortCourseType === "通修")
      .reduce((total, { point }) => total + point, 0);
    const totalCommonOptionalPoint = filteredData
      .filter(({ shortCourseType }) => shortCourseType === "通选")
      .reduce((total, { point }) => total + point, 0);
    const totalMajorRequiredPoint = filteredData
      .filter(({ shortCourseType }) => shortCourseType === "专修")
      .reduce((total, { point }) => total + point, 0);
    const totalMajorOptionalPoint = filteredData
      .filter(({ shortCourseType }) => shortCourseType === "专选")
      .reduce((total, { point }) => total + point, 0);
    const totalTeacherRequiredPoint = filteredData
      .filter(({ shortCourseType }) => shortCourseType === "师修")
      .reduce((total, { point }) => total + point, 0);
    const totalTeacherOptionalPoint = filteredData
      .filter(({ shortCourseType }) => shortCourseType === "师选")
      .reduce((total, { point }) => total + point, 0);

    const totalGradePoint = filteredData.reduce(
      (total, { gradePoint }) => total + gradePoint,
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

  changeTime({ detail }: WechatMiniprogram.PickerChange) {
    const timeIndex = Number(detail.value);
    const { times, timeIndex: timeOldIndex } = this.data;

    if (timeIndex !== timeOldIndex) {
      const time = times[timeIndex];

      this.setData({ timeIndex });
      this.getGradeList({ time });
    }
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

  showScoreDetail({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { grades } = this.data;
    const { name, gradeDetail, mark } = grades[index];

    if (gradeDetail) {
      const { usual, exam } = gradeDetail;

      showModal(
        `${name}成绩详情`,
        `${mark ? `${mark}\n` : ""}${usual
          .map(
            ({ score, percent }, index) =>
              `平时成绩${
                usual.length > 1 ? index + 1 : ""
              }: ${score}分，占比${percent}%`,
          )
          .join("\n")}${
          exam ? `\n期末成绩: ${exam.score}分，占比${exam.percent}%` : ""
        }`,
      );
    } else showModal(name, "暂无成绩详情");
  },
});

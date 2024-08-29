import { $Page, get, set, showModal } from "@mptool/all";

import {
  GRADE_DATA_KEY,
  HOUR,
  appCoverPrefix,
} from "../../../../config/index.js";
import { envName, info, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type {
  UnderGradeListOptions,
  UnderGradeResult,
} from "../../service/index.js";
import { getUnderGradeDetail, getUnderGradeList } from "../../service/index.js";

const PAGE_ID = "under-grade";
const PAGE_TITLE = "本科成绩查询";
const keys = [
  "name",
  "grade",
  "point",
  "shortCourseType",
  "time",
  "hours",
  "examType",
] as const;

interface TimeConfig {
  under: string[];
  display: string[];
}

const getTimeConfig = (grade: number): TimeConfig => {
  const date = new Date();

  const currentYear = date.getFullYear();
  const currentMonth = date.getMonth() + 1;
  const underTimes: string[] = [];
  const display: string[] = [];

  for (let i = grade; i < currentYear - 1; i++) {
    underTimes.push(`${i}01`, `${i}02`);
    display.push(`${i}年秋季学期`, `${i + 1}年春季学期`);
  }

  underTimes.push(`${currentYear - 1}01`);
  display.push(`${currentYear - 1}年秋季学期`);

  if (currentMonth >= 6) {
    underTimes.push(`${currentYear - 1}02`);
    display.push(`${currentYear}年春季学期`);
  }
  if (currentMonth === 12) {
    underTimes.push(`${currentYear}01`);
    display.push(`${currentYear}年秋季学期`);
  }

  return {
    under: underTimes,
    display,
  };
};

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    grades: [] as UnderGradeResult[],

    type: "",
    timeIndex: 0,

    showMark: false,
    totalPoint: 0,
    totalCommonRequiredPoint: 0,
    totalCommonOptionalPoint: 0,
    totalMajorMainPoint: 0,
    totalMajorOptionalPoint: 0,
    totalTeacherRequiredPoint: 0,
    totalTeacherOptionalPoint: 0,
    totalGradePoint: 0,
    gpa: 0,

    sortIndex: -1,
    ascending: false,

    desc: "数据来自教务处本科教学服务系统，请以各学院实际安排与认定为准。",

    needLogin: false,
  },

  state: {
    numberValueIndex: [] as number[],
    timeConfig: {} as TimeConfig,
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
        return showModal("暂不支持", "仅本科生可使用本科成绩查询。");

      if (!this.state.inited || this.data.needLogin) {
        const timeConfig = getTimeConfig(info.grade);
        const grades = get<UnderGradeResult[]>(GRADE_DATA_KEY);

        this.state.timeConfig = timeConfig;
        this.setData({
          timeDisplays: ["全部学期", ...timeConfig.display],
        });

        if (grades) {
          this.setGradeData(grades);
          this.setStatistics(grades);
        } else {
          this.getGradeList();
        }
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

  async getGradeList(options: UnderGradeListOptions = {}) {
    wx.showLoading({ title: "获取中" });

    const result = await getUnderGradeList(options);

    wx.hideLoading();
    this.state.inited = true;

    if (!result.success) return showModal("获取失败", result.msg);

    set(
      `${GRADE_DATA_KEY}${options.time ? `-${options.time}` : ""}`,
      result.data,
      3 * HOUR,
    );
    this.setGradeData(result.data);
    if (!options.time) this.setStatistics(result.data);
  },

  setGradeData(grades: UnderGradeResult[]) {
    const showMark = grades.some((item) => item.mark);

    const numberValueIndex = keys
      .map((key, index) =>
        grades.some((item) => Number.isNaN(Number(item[key]))) ? null : index,
      )
      .filter((item): item is number => item !== null);

    this.state.numberValueIndex = numberValueIndex;

    this.setData({
      // 默认通过时间排序
      grades: grades.sort((itemA, itemB) =>
        itemB.time?.localeCompare(itemA.time),
      ),
      showMark,
    });
  },

  setStatistics(grades: UnderGradeResult[]) {
    const gradeMap = new Map<string, UnderGradeResult>();

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
      (total, { grade, point }) => total + ((grade - 50) / 10) * point,
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
    const { timeIndex: timeOldIndex } = this.data;
    const { timeConfig } = this.state;

    if (timeIndex !== timeOldIndex) {
      const time = timeConfig.under[timeIndex - 1];

      this.setData({ timeIndex });
      this.getGradeList(time ? { time } : {});
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
            ? (itemA[key] as string)?.localeCompare(itemB[key] as string)
            : (itemB[key] as string)?.localeCompare(itemA[key] as string);
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
    const { name, gradeCode, mark } = grades[index];

    getUnderGradeDetail(gradeCode).then((res) => {
      if (res.success)
        showModal(
          `${name}成绩详情`,
          `${mark ? `${mark}\n` : ""}${res.data
            .map(
              ({ name, percent, score }) =>
                `${name}: ${score}分，占比${percent}%`,
            )
            .join("\n")}`,
        );
      else showModal("获取失败", res.msg);
    });
  },
});

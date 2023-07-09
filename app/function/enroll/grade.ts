import { $Page } from "@mptool/enhance";

import { type HistoryGradeInfoItem, getHistoryGrade } from "./api.js";
import { type EnrollPlanConfig } from "../../../typings/index.js";
import { showModal } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "enroll-grade";
const PAGE_TITLE = "往年分数";

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    years: <string[]>[],
    provinces: <string[]>[],
    majorTypes: <string[]>[],
    planTypes: <string[]>[],
    reformTypes: <string[]>[],

    yearIndex: 0,
    provinceIndex: 0,
    majorTypeIndex: 0,
    planTypeIndex: 0,
    reformTypeIndex: 0,

    titles: <string[]>[],
    sortIndex: 0,
    ascending: false,

    popupConfig: {
      title: "历史分数详情",
      cancel: false,
    },
    results: <HistoryGradeInfoItem[]>[],
  },

  state: {
    historyGrade: <EnrollPlanConfig>[],
    numberValueIndex: <number[]>[],
  },

  onNavigate() {
    ensureJSON("function/enroll/grade");
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      firstPage: getCurrentPages().length === 1,
    });

    getJSON<EnrollPlanConfig>("function/enroll/grade")
      .then((historyGrade) => {
        this.state.historyGrade = historyGrade;
        this.setData({
          years: ["", ...historyGrade.map(({ year }) => year)],
        });
      })
      .catch(() => {
        showModal(
          "获取失败",
          "招生计划获取失败，请稍后重试。如果该情况持续发生，请反馈给开发者",
          () => this.back()
        );
      });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/enroll/plan",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  yearChange({ detail }: WechatMiniprogram.PickerChange) {
    const { historyGrade } = this.state;
    const yearIndex = Number(detail.value);

    this.setData({
      yearIndex,
      provinceIndex: 0,
      planTypeIndex: 0,
      majorTypeIndex: 0,
      reformTypeIndex: 0,

      provinces: [
        "",
        ...historyGrade[yearIndex - 1].items.map(({ province }) => province),
      ],

      // reset others
      planTypes: [],
      majorTypes: [],
      reformTypes: [],
    });
  },

  provinceChange({ detail }: WechatMiniprogram.PickerChange) {
    const { yearIndex } = this.data;
    const { historyGrade } = this.state;
    const provinceIndex = Number(detail.value);

    this.setData({
      provinceIndex,
      planTypeIndex: 0,
      majorTypeIndex: 0,
      reformTypeIndex: 0,

      planTypes: [
        "",
        ...historyGrade[yearIndex - 1].items[provinceIndex - 1].items.map(
          ({ plan }) => plan
        ),
      ],

      // reset others
      majorTypes: [],
      reformTypes: [],
    });
  },

  planTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const { yearIndex, provinceIndex } = this.data;
    const { historyGrade } = this.state;
    const planTypeIndex = Number(detail.value);

    this.setData({
      planTypeIndex,
      majorTypeIndex: 0,
      reformTypeIndex: 0,

      majorTypes: [
        "",
        ...historyGrade[yearIndex - 1].items[provinceIndex - 1].items[
          planTypeIndex - 1
        ].items.map(({ category }) => category),
      ],

      // reset others
      reformTypes: [],
    });
  },

  majorTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const { yearIndex, provinceIndex, planTypeIndex } = this.data;
    const { historyGrade } = this.state;
    const majorTypeIndex = Number(detail.value);

    this.setData({
      majorTypeIndex,
      reformTypeIndex: 0,

      reformTypes: [
        "",
        ...historyGrade[yearIndex - 1].items[provinceIndex - 1].items[
          planTypeIndex - 1
        ].items[majorTypeIndex - 1].items.map(({ type }) => type),
      ],
    });
  },

  reformTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const reformTypeIndex = Number(detail.value);

    this.setData({ reformTypeIndex });
  },

  getPlan() {
    const {
      yearIndex,
      provinceIndex,
      planTypeIndex,
      majorTypeIndex,
      reformTypeIndex,
      years,
      provinces,
      planTypes,
      majorTypes,
      reformTypes,
      ascending,
    } = this.data;

    if (
      yearIndex === 0 ||
      provinceIndex === 0 ||
      planTypeIndex === 0 ||
      majorTypeIndex === 0 ||
      reformTypeIndex === 0
    ) {
      showModal("缺少选项", "请补充选项");

      return;
    }

    wx.showLoading({ title: "检索中" });

    return getHistoryGrade({
      year: years[yearIndex],
      province: provinces[provinceIndex],
      majorType: majorTypes[majorTypeIndex],
      planType: planTypes[planTypeIndex],
      reformType: reformTypes[reformTypeIndex],
    })
      .then((data) => {
        wx.hideLoading();
        if (data.status === "success") {
          const { titles, items } = data.data;
          const numberValueIndex = items
            .map((item, index) => (Number.isNaN(Number(item)) ? null : index))
            .filter((item): item is number => item !== null);

          this.state.numberValueIndex = numberValueIndex;

          this.setData({
            titles,
            sortIndex: 0,
            results: items.sort((itemA, itemB) =>
              numberValueIndex.includes(0)
                ? ascending
                  ? Number(itemB[0]) - Number(itemA[0])
                  : Number(itemA[0]) - Number(itemB[0])
                : ascending
                ? itemA[0].localeCompare(itemB[0])
                : itemB[0].localeCompare(itemA[0])
            ),
          });
        } else showModal("获取失败", data.msg);
      })
      .catch(() => {
        showModal("获取失败", "网络请求失败");
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
    const { ascending, sortIndex, results } = this.data;
    const { numberValueIndex } = this.state;

    if (index === sortIndex) {
      this.setData({
        ascending: !ascending,
        results: results.reverse(),
      });
    } else {
      this.setData({
        sortIndex: index,
        results: results.sort((itemA, itemB) =>
          numberValueIndex.includes(index)
            ? ascending
              ? Number(itemB[index]) - Number(itemA[index])
              : Number(itemA[index]) - Number(itemB[index])
            : ascending
            ? itemA[index].localeCompare(itemB[index])
            : itemB[index].localeCompare(itemA[index])
        ),
      });
    }
  },

  close() {
    this.setData({ results: [] });
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});

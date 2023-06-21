import { $Page } from "@mptool/enhance";

import { type HistoryGradeInfo, getHistoryGrade } from "./api.js";
import { type EnrollPlanConfig } from "../../../typings/index.js";
import { type AppOption } from "../../app.js";
import { modal } from "../../utils/api.js";
import { appCoverPrefix } from "../../utils/config.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

type SortKey = "major" | "min" | "max" | "average";

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

    yearIndex: -1,
    provinceIndex: -1,
    majorTypeIndex: -1,
    planTypeIndex: -1,
    reformTypeIndex: -1,

    sort: <SortKey>"major",
    ascending: false,

    popupConfig: {
      title: "历史分数详情",
      cancel: false,
    },
    results: <HistoryGradeInfo[]>[],
  },

  state: { historyGrade: <EnrollPlanConfig>[] },

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
          years: historyGrade.map(({ year }) => year),
        });
      })
      .catch(() => {
        modal(
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
      provinceIndex: -1,
      planTypeIndex: -1,
      majorTypeIndex: -1,
      reformTypeIndex: -1,

      provinces: historyGrade[yearIndex].items.map(({ province }) => province),

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
      planTypeIndex: -1,
      majorTypeIndex: -1,
      reformTypeIndex: -1,

      planTypes: historyGrade[yearIndex].items[provinceIndex].items.map(
        ({ plan }) => plan
      ),

      // reset others
      majorTypes: [],
      reformTypes: [],

      results: [],
    });
  },

  planTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const { yearIndex, provinceIndex } = this.data;
    const { historyGrade } = this.state;
    const planTypeIndex = Number(detail.value);

    this.setData({
      planTypeIndex,
      majorTypeIndex: -1,
      reformTypeIndex: -1,

      majorTypes: historyGrade[yearIndex].items[provinceIndex].items[
        planTypeIndex
      ].items.map(({ category }) => category),

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
      reformTypeIndex: -1,

      reformTypes: historyGrade[yearIndex].items[provinceIndex].items[
        planTypeIndex
      ].items[majorTypeIndex].items.map(({ type }) => type),
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
      sort,
    } = this.data;

    if (
      yearIndex === -1 ||
      provinceIndex === -1 ||
      planTypeIndex === -1 ||
      majorTypeIndex === -1 ||
      reformTypeIndex === -1
    ) {
      modal("缺少选项", "请补充全部选项");

      return;
    }

    wx.showLoading({ title: "检索中" });

    return getHistoryGrade({
      year: years[yearIndex],
      province: provinces[provinceIndex],
      majorType: majorTypes[planTypeIndex],
      planType: planTypes[majorTypeIndex],
      reformType: reformTypes[reformTypeIndex],
    })
      .then((data) => {
        wx.hideLoading();
        if (data.status === "success")
          this.setData({
            results: data.data.sort((itemA, itemB) =>
              sort === "major"
                ? ascending
                  ? itemA[sort].localeCompare(itemB[sort])
                  : itemB[sort].localeCompare(itemA[sort])
                : ascending
                ? Number(itemB[sort]) - Number(itemA[sort])
                : Number(itemA[sort]) - Number(itemB[sort])
            ),
          });
        else modal("获取失败", data.msg);
      })
      .catch(() => {
        modal("获取失败", "网络请求失败");
      });
  },

  sortResults({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { key: SortKey }
  >) {
    const { key } = currentTarget.dataset;
    const { ascending, sort, results } = this.data;

    if (key === sort) {
      this.setData({
        ascending: !ascending,
        results: results.reverse(),
      });
    } else {
      this.setData({
        sort: key,
        results: results.sort((itemA, itemB) =>
          key === "major"
            ? ascending
              ? itemA[key].localeCompare(itemB[key])
              : itemB[key].localeCompare(itemA[key])
            : ascending
            ? Number(itemB[key]) - Number(itemA[key])
            : Number(itemA[key]) - Number(itemB[key])
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

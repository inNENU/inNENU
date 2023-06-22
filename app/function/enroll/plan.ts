import { $Page } from "@mptool/enhance";

import { type EnrollPlanInfo, getEnrollPlan } from "./api.js";
import { type EnrollPlanConfig } from "../../../typings/index.js";
import { type AppOption } from "../../app.js";
import { modal } from "../../utils/api.js";
import { appCoverPrefix } from "../../utils/config.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "enroll-plan";
const PAGE_TITLE = "招生计划";

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

    popupConfig: {
      title: "招生计划详情",
      cancel: false,
    },
    results: <EnrollPlanInfo[]>[],
  },

  state: { enrollPlan: <EnrollPlanConfig>[] },

  onNavigate() {
    ensureJSON("function/enroll/plan");
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      firstPage: getCurrentPages().length === 1,
    });

    getJSON<EnrollPlanConfig>("function/enroll/plan")
      .then((enrollPlan) => {
        this.state.enrollPlan = enrollPlan;
        this.setData({
          years: enrollPlan.map(({ year }) => year),
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
    const { enrollPlan } = this.state;
    const yearIndex = Number(detail.value);

    this.setData({
      yearIndex,
      provinceIndex: -1,
      planTypeIndex: -1,
      majorTypeIndex: -1,
      reformTypeIndex: -1,

      provinces: enrollPlan[yearIndex].items.map(({ province }) => province),

      // reset others
      planTypes: [],
      majorTypes: [],
      reformTypes: [],
    });
  },

  provinceChange({ detail }: WechatMiniprogram.PickerChange) {
    const { yearIndex } = this.data;
    const { enrollPlan } = this.state;
    const provinceIndex = Number(detail.value);

    this.setData({
      provinceIndex,
      planTypeIndex: -1,
      majorTypeIndex: -1,
      reformTypeIndex: -1,

      planTypes: enrollPlan[yearIndex].items[provinceIndex].items.map(
        ({ plan }) => plan
      ),

      // reset others
      majorTypes: [],
      reformTypes: [],
    });
  },

  planTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const { yearIndex, provinceIndex } = this.data;
    const { enrollPlan } = this.state;
    const planTypeIndex = Number(detail.value);

    this.setData({
      planTypeIndex,
      majorTypeIndex: -1,
      reformTypeIndex: -1,

      majorTypes: enrollPlan[yearIndex].items[provinceIndex].items[
        planTypeIndex
      ].items.map(({ category }) => category),

      // reset others
      reformTypes: [],
    });
  },

  majorTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const { yearIndex, provinceIndex, planTypeIndex } = this.data;
    const { enrollPlan } = this.state;
    const majorTypeIndex = Number(detail.value);

    this.setData({
      majorTypeIndex,
      reformTypeIndex: -1,

      reformTypes: enrollPlan[yearIndex].items[provinceIndex].items[
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

    return getEnrollPlan({
      year: years[yearIndex],
      province: provinces[provinceIndex],
      majorType: majorTypes[majorTypeIndex],
      planType: planTypes[planTypeIndex],
      reformType: reformTypes[reformTypeIndex],
    })
      .then((data) => {
        wx.hideLoading();
        if (data.status === "success")
          this.setData({
            results: data.data,
          });
        else modal("获取失败", data.msg);
      })
      .catch(() => {
        modal("获取失败", "网络请求失败");
      });
  },

  close() {
    this.setData({ results: [] });
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});

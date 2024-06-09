import { $Page } from "@mptool/all";

import { showModal } from "../../api/index.js";
import { appCoverPrefix } from "../../config/index.js";
import type { UnderEnrollPlanConfig } from "../../service/index.js";
import { getUnderEnrollPlan } from "../../service/index.js";
import { info } from "../../state/info.js";
import { getColor, popNotice } from "../../utils/page.js";

const PAGE_ID = "under-enroll-plan";
const PAGE_TITLE = "本科招生计划";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,

    years: [] as string[],
    provinces: [] as string[],
    majorTypes: [] as string[],
    planTypes: [] as string[],
    majorClasses: [] as string[],

    yearIndex: 0,
    provinceIndex: 0,
    majorTypeIndex: 0,
    planTypeIndex: 0,
    majorClassIndex: 0,

    popupConfig: {
      title: "招生计划详情",
      cancel: false,
    },
    results: [] as UnderEnrollPlanConfig[],
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: info.theme,
    });
    this.getPlanInfo();
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/enroll/under-plan",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getPlanInfo() {
    const { years, provinces } = await getUnderEnrollPlan({
      type: "info",
    });

    this.setData({ years, provinces });
  },

  async getPlanType() {
    const { yearIndex, years, provinceIndex, provinces } = this.data;

    const planTypes = await getUnderEnrollPlan({
      type: "planType",
      year: years[yearIndex - 1],
      province: provinces[provinceIndex - 1],
    });

    this.setData({ planTypes });

    if (planTypes.length === 1) {
      this.setData({ planTypeIndex: 1 });
      // @ts-expect-error: Fake event
      this.planTypeChange({ detail: { value: 1 } });
      this.getMajorType();
    }
  },

  async getMajorType() {
    const {
      yearIndex,
      years,
      provinceIndex,
      provinces,
      planTypeIndex,
      planTypes,
    } = this.data;

    const majorTypes = await getUnderEnrollPlan({
      type: "majorType",
      year: years[yearIndex - 1],
      province: provinces[provinceIndex - 1],
      plan: planTypes[planTypeIndex - 1],
    });

    this.setData({ majorTypes });

    if (majorTypes.length === 1) {
      this.setData({ majorTypeIndex: 1 });
      // @ts-expect-error: Fake event
      this.majorTypeChange({ detail: { value: 1 } });
      this.getMajorClass();
    }
  },

  async getMajorClass() {
    const {
      yearIndex,
      years,
      provinceIndex,
      provinces,
      planTypeIndex,
      planTypes,
      majorTypeIndex,
      majorTypes,
    } = this.data;

    const majorClasses = await getUnderEnrollPlan({
      type: "majorClass",
      year: years[yearIndex - 1],
      province: provinces[provinceIndex - 1],
      plan: planTypes[planTypeIndex - 1],
      majorType: majorTypes[majorTypeIndex - 1],
    });

    this.setData({ majorClasses });

    if (majorClasses.length === 1) {
      this.setData({ majorClassIndex: 1 });
    }
  },

  yearChange({ detail }: WechatMiniprogram.PickerChange) {
    const yearIndex = Number(detail.value);

    if (yearIndex !== this.data.yearIndex) {
      this.setData({
        yearIndex,
        provinceIndex: 0,
        planTypes: [],
        planTypeIndex: 0,
        majorTypes: [],
        majorTypeIndex: 0,
        majorClasses: [],
        majorClassIndex: 0,
      });
    }
  },

  provinceChange({ detail }: WechatMiniprogram.PickerChange) {
    const provinceIndex = Number(detail.value);

    if (provinceIndex !== this.data.provinceIndex) {
      this.setData({
        provinceIndex,
        planTypes: [],
        planTypeIndex: 0,
        majorTypes: [],
        majorTypeIndex: 0,
        majorClasses: [],
        majorClassIndex: 0,
      });
      this.getPlanType();
    }
  },

  planTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const planTypeIndex = Number(detail.value);

    if (planTypeIndex !== this.data.planTypeIndex) {
      this.setData({
        planTypeIndex,
        majorTypes: [],
        majorTypeIndex: 0,
        majorClasses: [],
        majorClassIndex: 0,
      });
      this.getMajorType();
    }
  },

  majorTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const majorTypeIndex = Number(detail.value);

    if (majorTypeIndex !== this.data.majorTypeIndex) {
      this.setData({
        majorTypeIndex,
        majorClasses: [],
        majorClassIndex: 0,
      });
      this.getMajorClass();
    }
  },

  majorClassChange({ detail }: WechatMiniprogram.PickerChange) {
    this.setData({ majorClassIndex: Number(detail.value) });
  },

  getPlan() {
    const {
      yearIndex,
      provinceIndex,
      planTypeIndex,
      majorTypeIndex,
      majorClassIndex,
      years,
      provinces,
      planTypes,
      majorTypes,
      majorClasses,
    } = this.data;

    if (
      yearIndex === 0 ||
      provinceIndex === 0 ||
      planTypeIndex === 0 ||
      majorTypeIndex === 0 ||
      majorClassIndex === 0
    ) {
      showModal("缺少选项", "请补充全部选项");

      return;
    }

    wx.showLoading({ title: "查询中" });

    return getUnderEnrollPlan({
      type: "query",
      year: years[yearIndex - 1],
      province: provinces[provinceIndex - 1],
      plan: planTypes[planTypeIndex - 1],
      majorType: majorTypes[majorTypeIndex - 1],
      majorClass: majorClasses[majorClassIndex - 1],
    }).then((data) => {
      wx.hideLoading();
      this.setData({ results: data });
    });
  },

  close() {
    this.setData({ results: [] });
  },
});

import { $Page } from "@mptool/all";

import { showModal } from "../../api/index.js";
import { appCoverPrefix } from "../../config/index.js";
import type { UnderHistoryGradeConfig } from "../../service/index.js";
import { getUnderHistoryGrade } from "../../service/index.js";
import { info } from "../../state/index.js";
import { getColor, popNotice } from "../../utils/index.js";

const PAGE_ID = "under-history-grade";
const PAGE_TITLE = "往年分数线";

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

    titles: [] as { text: string; key: string }[],
    sortKey: "",
    ascending: false,

    popupConfig: {
      title: "历史分数详情",
      cancel: false,
    },
    results: [] as UnderHistoryGradeConfig[],
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: info.theme,
    });
    this.getHistoryGradeInfo();
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/enroll/history-grade",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getHistoryGradeInfo() {
    const { years, provinces } = await getUnderHistoryGrade({
      type: "info",
    });

    this.setData({ years, provinces });
  },

  async getPlanType() {
    const { yearIndex, years, provinceIndex, provinces } = this.data;

    const planTypes = await getUnderHistoryGrade({
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

    const majorTypes = await getUnderHistoryGrade({
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

    const majorClasses = await getUnderHistoryGrade({
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

  getScore() {
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

    return getUnderHistoryGrade({
      type: "query",
      year: years[yearIndex - 1],
      province: provinces[provinceIndex - 1],
      plan: planTypes[planTypeIndex - 1],
      majorType: majorTypes[majorTypeIndex - 1],
      majorClass: majorClasses[majorClassIndex - 1],
    }).then((data) => {
      wx.hideLoading();
      const titles = [
        {
          text: "专业",
          key: "major",
        },
        {
          text: "专业类别",
          key: "majorType",
        },
      ];

      if (data.some(({ minMajorScore }) => minMajorScore > 0))
        titles.push({
          text: "专业录取线",
          key: "minMajorScore",
        });
      if (data.some(({ minCulturalScore }) => minCulturalScore > 0))
        titles.push({
          text: "最低文化成绩",
          key: "minCulturalScore",
        });
      if (data.some(({ minAdmissionScore }) => minAdmissionScore > 0))
        titles.push({
          text: "最低录取成绩",
          key: "minAdmissionScore",
        });
      if (data.some(({ maxAdmissionScore }) => maxAdmissionScore > 0))
        titles.push({
          text: "最高录取成绩",
          key: "maxAdmissionScore",
        });

      this.setData({ titles, sortKey: "", results: data });
      this.sortResults({
        // @ts-expect-error: Fake event
        currentTarget: { dataset: { key: titles[0].key } },
      });
    });
  },

  sortResults({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { key: keyof UnderHistoryGradeConfig }
  >) {
    const { key } = currentTarget.dataset;
    const { ascending, sortKey, results } = this.data;

    if (key === sortKey) {
      this.setData({
        ascending: !ascending,
        results: results.reverse(),
      });
    } else {
      this.setData({
        sortKey: key,
        results: results.sort((itemA, itemB) =>
          key === "major" || key === "majorType"
            ? ascending
              ? itemA[key].localeCompare(itemB[key])
              : itemB[key].localeCompare(itemA[key])
            : ascending
              ? Number(itemB[key]) - Number(itemA[key])
              : Number(itemA[key]) - Number(itemB[key]),
        ),
      });
    }
  },

  close() {
    this.setData({ results: [] });
  },
});

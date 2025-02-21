import { $Page, showModal } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type {
  UnderEnrollPlanConfig,
  UnderEnrollPlanOptionInfo,
} from "../../service/index.js";
import { getUnderEnrollPlan } from "../../service/index.js";

const PAGE_ID = "under-enroll-plan";
const PAGE_TITLE = "本科招生计划";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,

    provinces: [] as string[],
    years: [] as string[],
    majorTypes: [] as string[],
    classTypes: [] as string[],

    provinceIndex: 0,
    yearIndex: 0,
    majorTypeIndex: 0,
    classTypeIndex: 0,

    popupConfig: {
      title: "招生计划详情",
      cancel: false,
    },
    results: [] as UnderEnrollPlanConfig[],
  },

  state: {
    options: {} as UnderEnrollPlanOptionInfo,
    yearOptions: {} as Record<string, Record<string, string[]>>,
    planOptions: {} as Record<string, string[]>,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });
    this.getPlanInfo();
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getPlanInfo() {
    const result = await getUnderEnrollPlan({
      type: "info",
    });

    if (!result.success) {
      showModal("查询失败", result.msg);

      return;
    }

    this.setData({ provinces: Object.keys(result.data) });
    this.state.options = result.data;
  },

  provinceChange({ detail }: WechatMiniprogram.PickerChange) {
    const provinceIndex = Number(detail.value);

    if (provinceIndex !== this.data.provinceIndex) {
      this.setData({ provinceIndex });
      this.setYearOptions();
    }
  },

  yearChange({ detail }: WechatMiniprogram.PickerChange) {
    const yearIndex = Number(detail.value);

    if (yearIndex !== this.data.yearIndex) {
      this.setData({ yearIndex });
      this.setMajorTypeOptions();
    }
  },

  majorTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const majorTypeIndex = Number(detail.value);

    if (majorTypeIndex !== this.data.majorTypeIndex) {
      this.setData({ majorTypeIndex });
      this.setClassTypeOptions();
    }
  },

  classTypeChange({ detail }: WechatMiniprogram.PickerChange) {
    const classTypeIndex = Number(detail.value);

    if (classTypeIndex !== this.data.classTypeIndex) {
      this.setData({ classTypeIndex });
    }
  },

  setYearOptions() {
    const {
      provinceIndex,
      provinces,
      years: oldYears,
      yearIndex: oldYearIndex,
    } = this.data;

    if (provinceIndex !== 0) {
      const province = provinces[provinceIndex - 1];
      const yearOptions = this.state.options[province];
      const years = Object.keys(yearOptions);
      const oldYear = oldYears[oldYearIndex - 1];
      const yearIndex = years.indexOf(oldYear);

      this.state.yearOptions = yearOptions;

      // restore the previous selection
      if (yearIndex !== -1) {
        this.setData({ years, yearIndex });
        this.setMajorTypeOptions();

        return;
      }

      // if there is only one year, select it
      if (years.length === 1) {
        this.setData({ years, yearIndex: 1 });
        this.setMajorTypeOptions();

        return;
      }

      this.setData({
        years,
        yearIndex: 0,
        majorTypes: [],
        majorTypeIndex: 0,
        classTypes: [],
        classTypeIndex: 0,
      });

      return;
    }

    this.setData({
      years: [],
      yearIndex: 0,
      majorTypes: [],
      majorTypeIndex: 0,
      classTypes: [],
      classTypeIndex: 0,
    });

    return;
  },

  setMajorTypeOptions() {
    const {
      years,
      yearIndex,
      majorTypes: oldMajorTypes,
      majorTypeIndex: oldMajorTypeIndex,
    } = this.data;

    if (yearIndex !== 0) {
      const year = years[yearIndex - 1];
      const planOptions = this.state.yearOptions[year];
      const oldMajorType = oldMajorTypes[oldMajorTypeIndex - 1];
      const majorTypes = Object.keys(planOptions);
      const majorTypeIndex = majorTypes.indexOf(oldMajorType);

      this.state.planOptions = planOptions;

      // restore the previous selection
      if (majorTypes.includes(oldMajorType)) {
        this.setData({ majorTypes, majorTypeIndex });
        this.setClassTypeOptions();

        return;
      }

      // if there is only one major type, select it
      if (majorTypes.length === 1) {
        this.setData({ majorTypes, majorTypeIndex: 1 });
        this.setClassTypeOptions();

        return;
      }

      this.setData({
        majorTypes,
        majorTypeIndex: 0,
        classTypes: [],
        classTypeIndex: 0,
      });

      return;
    }

    this.setData({
      majorTypes: [],
      majorTypeIndex: 0,
      classTypes: [],
      classTypeIndex: 0,
    });

    return;
  },

  setClassTypeOptions() {
    const {
      majorTypes,
      majorTypeIndex,
      classTypes: oldClassTypes,
      classTypeIndex: oldClassTypeIndex,
    } = this.data;

    if (majorTypeIndex !== 0) {
      const classTypes = this.state.planOptions[majorTypes[majorTypeIndex - 1]];

      const oldClassType = oldClassTypes[oldClassTypeIndex - 1];
      const classTypeIndex = classTypes.indexOf(oldClassType);

      // restore the previous selection
      if (classTypeIndex !== -1) {
        this.setData({ classTypes, classTypeIndex });

        return;
      }

      // if there is only one class type, select it
      if (classTypes.length === 1) {
        this.setData({ classTypes, classTypeIndex: 1 });

        return;
      }

      this.setData({ classTypes, classTypeIndex: 0 });

      return;
    }

    this.setData({ classTypes: [], classTypeIndex: 0 });

    return;
  },

  getPlan() {
    const {
      provinces,
      provinceIndex,
      years,
      yearIndex,
      majorTypes,
      majorTypeIndex,
      classTypes,
      classTypeIndex,
    } = this.data;

    if (
      yearIndex === 0 ||
      provinceIndex === 0 ||
      majorTypeIndex === 0 ||
      classTypeIndex === 0
    ) {
      showModal("缺少选项", "请补充全部选项");

      return;
    }

    wx.showLoading({ title: "查询中" });

    return getUnderEnrollPlan({
      type: "query",
      year: years[yearIndex - 1],
      province: provinces[provinceIndex - 1],
      majorType: majorTypes[majorTypeIndex - 1],
      classType: classTypes[classTypeIndex - 1],
    }).then((result) => {
      wx.hideLoading();
      if (result.success) {
        this.setData({ results: result.data });
      } else {
        showModal("查询失败", result.msg);
      }
    });
  },

  close() {
    this.setData({ results: [] });
  },
});

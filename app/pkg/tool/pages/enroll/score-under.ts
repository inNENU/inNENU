import { $Page } from "@mptool/all";

import { showModal } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type {
  UnderHistoryScoreConfig,
  UnderHistoryScoreOptionInfo,
} from "../../service/index.js";
import { getUnderHistoryScore } from "../../service/index.js";

const PAGE_ID = "under-enroll-score";
const PAGE_TITLE = "往年分数线";

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

    titles: [] as { text: string; key: string }[],
    sortKey: "",
    ascending: false,

    popupConfig: {
      title: "历史分数详情",
      cancel: false,
    },
    results: [] as UnderHistoryScoreConfig[],
  },

  state: {
    options: {} as UnderHistoryScoreOptionInfo,
    yearOptions: {} as Record<string, Record<string, string[]>>,
    planOptions: {} as Record<string, string[]>,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });
    this.getHistoryScoreInfo();
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

  async getHistoryScoreInfo() {
    const result = await getUnderHistoryScore({
      type: "info",
    });

    if (!result.success) {
      return showModal("查询失败", result.msg);
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
      this.state.yearOptions = this.state.options[provinces[provinceIndex - 1]];

      const oldYear = oldYears[oldYearIndex - 1];
      const years = Object.keys(this.state.yearOptions);
      const yearIndex = years.indexOf(oldYear);

      if (yearIndex !== -1) {
        this.setData({ years, yearIndex });

        return this.setMajorTypeOptions();
      }

      if (years.length === 1) {
        this.setData({ years, yearIndex: 1 });

        return this.setMajorTypeOptions();
      }

      return this.setData({
        years,
        majorTypes: [],
        majorTypeIndex: 0,
        classTypes: [],
        classTypeIndex: 0,
      });
    }

    return this.setData({
      years: [],
      yearIndex: 0,
      majorTypes: [],
      majorTypeIndex: 0,
      classTypes: [],
      classTypeIndex: 0,
    });
  },

  setMajorTypeOptions() {
    const {
      years,
      yearIndex,
      majorTypes: oldMajorTypes,
      majorTypeIndex: oldMajorTypeIndex,
    } = this.data;

    if (yearIndex !== 0) {
      this.state.planOptions = this.state.yearOptions[years[yearIndex - 1]];

      const oldMajorType = oldMajorTypes[oldMajorTypeIndex - 1];
      const majorTypes = Object.keys(this.state.planOptions);
      const majorTypeIndex = majorTypes.indexOf(oldMajorType);

      if (majorTypes.indexOf(oldMajorType) !== -1) {
        this.setData({ majorTypes, majorTypeIndex });

        return this.setClassTypeOptions();
      }

      if (years.length === 1) {
        this.setData({ majorTypes, majorTypeIndex: 1 });

        return this.setClassTypeOptions();
      }

      return this.setData({
        majorTypes,
        majorTypeIndex: 0,
        classTypes: [],
        classTypeIndex: 0,
      });
    }

    return this.setData({
      majorTypes: [],
      majorTypeIndex: 0,
      classTypes: [],
      classTypeIndex: 0,
    });
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

      if (classTypeIndex !== -1) {
        return this.setData({ classTypes, classTypeIndex });
      }

      if (classTypes.length === 1) {
        return this.setData({ classTypes, classTypeIndex: 1 });
      }

      return this.setData({ classTypes, classTypeIndex: 0 });
    }

    return this.setData({ classTypes: [], classTypeIndex: 0 });
  },

  getScore() {
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

    return getUnderHistoryScore({
      type: "query",
      year: years[yearIndex - 1],
      province: provinces[provinceIndex - 1],
      majorType: majorTypes[majorTypeIndex - 1],
      classType: classTypes[classTypeIndex - 1],
    }).then((result) => {
      wx.hideLoading();

      if (result.success) {
        const titles = [
          {
            text: "专业",
            key: "major",
          },
          {
            text: "专业类别",
            key: "majorType",
          },
          {
            text: "录取控制线",
            key: "baseline",
          },
          {
            text: "最低分",
            key: "minScore",
          },
          {
            text: "最高分",
            key: "maxScore",
          },
          {
            text: "平均分",
            key: "averageScore",
          },
        ];

        this.setData({ titles, sortKey: "", results: result.data });
        this.sortResults({
          // @ts-expect-error: Fake event
          currentTarget: { dataset: { key: titles[0].key } },
        });
      } else {
        showModal("查询失败", result.msg);
      }
    });
  },

  sortResults({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { key: keyof UnderHistoryScoreConfig }
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
          key === "major" || key === "majorAttr"
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

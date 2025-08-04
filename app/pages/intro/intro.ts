import { $Page, get, set } from "@mptool/all";

import type { GridComponentOptions } from "../../../typings/index.js";
import { preloadSkyline } from "../../api/index.js";
import { checkResource } from "../../app/index.js";
import type { App } from "../../app.js";
import { DAY, appCoverPrefix } from "../../config/index.js";
import { searchMiniApp } from "../../service/index.js";
import { getIdentity, info, menuSpace, windowInfo } from "../../state/index.js";
import type { EntranceConfig } from "../../utils/index.js";
import {
  getJson,
  getPageColor,
  getTabData,
  showNotice,
} from "../../utils/index.js";

const { globalData } = getApp<App>();

const PAGE_ID = "intro";
const PAGE_TITLE = "东师介绍";
const PAGE_KEY = `${PAGE_ID}-page-data`;

interface IntroData {
  items: (Omit<GridComponentOptions, "tag"> & Record<string, unknown>)[];
  more: (Omit<GridComponentOptions, "tag"> & Record<string, unknown>)[];
}

const defaultData = get<IntroData | undefined>(PAGE_KEY);

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    statusBarHeight: windowInfo.statusBarHeight,
    menuSpace,

    /** 候选词 */
    words: [] as string[],

    /** 页面数据 */
    page: {
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
    },

    displayMore: false,
    ...defaultData,
  },

  onLoad() {
    this.setData({ color: getPageColor(true) });
    this.$on("settings", () => this.setPage());
  },

  onShow() {
    showNotice(PAGE_ID);

    this.setPage();
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);
    preloadSkyline();
  },

  async onPullDownRefresh() {
    this.setPage();
    await checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    this.$off("theme", this.setTheme);
  },

  setTheme(theme: string): void {
    this.setData({ color: getPageColor(this.data.page.grey), theme });
  },

  async setPage(): Promise<void> {
    if (globalData.settings) {
      const data = await getJson<EntranceConfig>("function/data/tab");

      const { id } = getIdentity();

      const { "intro-page": introPageConfig } = globalData.settings;

      const introConfig = introPageConfig[id] || introPageConfig.default;

      const config = Object.entries(data);

      const more = introConfig.more.map((item) => {
        const record = config.find(([key]) => key === item)![1];

        return {
          header: record.name,
          path: record.path,
          items: getTabData(record.items, PAGE_TITLE),
        };
      });

      const introData = {
        items: introConfig.items.map((item) => {
          const record = config.find(([key]) => key === item)![1];

          return {
            header: record.name,
            items: getTabData(record.items, PAGE_TITLE),
          };
        }),
        more,
        moreItems: more.map(({ header, path }) => {
          const item: { text: string; url?: string } = { text: header };

          if (path) item.url = `info?from=${PAGE_TITLE}&path=${path}`;

          return item;
        }),
      };

      set(PAGE_KEY, introData, 3 * DAY);

      this.setData(introData);
    }
  },

  openMore() {
    this.setData({ displayMore: true });
  },

  toggleMore() {
    this.setData({ displayMore: !this.data.displayMore });
  },

  /**
   * 在搜索框中输入时触发的函数
   *
   * @param value 输入的搜索词
   */
  async searching({ detail: { value } }: WechatMiniprogram.Input) {
    const words = await searchMiniApp<string[]>({
      scope: PAGE_ID,
      type: "word",
      word: value,
    });

    this.setData({ words });
  },

  /**
   * 跳转到搜索页面
   *
   * @param value 输入的搜索词
   */
  search({ detail }: WechatMiniprogram.Input) {
    this.$go(`search?type=${PAGE_ID}&word=${detail.value}`);
  },

  toggleFeature() {
    const isFlat = get<boolean>("flat-feature-panel") ?? true;

    this.$emit("feature-panel", !isFlat);
    set("flat-feature-panel", !isFlat);
  },
});

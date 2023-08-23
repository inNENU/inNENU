import { $Page, get, set } from "@mptool/skyline";

import type {
  GridComponentConfig,
  ListComponentItemConfig,
  PageDataWithContent,
} from "../../../typings/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { DAY } from "../../utils/constant.js";
import { getJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { search } from "../../utils/search.js";
import { getIdentity } from "../../utils/settings.js";
import type { TabData } from "../typings.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "guide";
const PAGE_TITLE = "东师指南";

interface GuideData {
  items: Omit<GridComponentConfig, "tag">[];
  more: Omit<GridComponentConfig, "tag">[];
}

const defaultData = get<GuideData | undefined>(PAGE_ID);

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    statusBarHeight: globalData.info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    menuSpace: globalData.env === "app" ? 10 : 90,

    /** 页面数据 */
    page: <PageDataWithContent>{
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
    },

    displayMore: false,
    ...defaultData,
  },

  onLoad() {
    this.setData({ color: getColor(true) });
    this.$on("data", () => this.setPage());
  },

  onShow() {
    popNotice(PAGE_ID);

    this.setPage();
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);
  },

  onPullDownRefresh() {
    this.setPage();
    checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({ title: PAGE_TITLE, path: "/pages/guide/guide" }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    this.$off("theme", this.setTheme);
  },

  setTheme(theme: string): void {
    this.setData({ color: getColor(this.data.page.grey), theme });
  },

  async setPage(): Promise<void> {
    if (globalData.data) {
      const data = await getJSON<TabData>("function/data/tab");

      const identify = getIdentity(globalData.userInfo);

      const { "guide-page": guidePageConfig } = globalData.data;

      const guideConfig = guidePageConfig[identify] || guidePageConfig.default;

      const config = Object.entries(data);

      const more = guideConfig.more.map((item) => {
        const record = config.find(([key]) => key === item)![1];

        return {
          header: record.name,
          path: record.path,
          items: record.items.map((item) => {
            if (item.path) item.url = `info?from=${PAGE_TITLE}&id=${item.path}`;

            return item;
          }),
        };
      });

      const guideData = {
        items: guideConfig.items.map((item) => {
          const record = config.find(([key]) => key === item)![1];

          return {
            header: record.name,
            items: record.items.map((item) => {
              if (item.path)
                item.url = `info?from=${PAGE_TITLE}&path=${item.path}`;

              return item;
            }),
          };
        }),
        more,
        moreItems: more.map(({ header, path }) => {
          const item: ListComponentItemConfig = { text: header };

          if (path) item.url = `info?from=${PAGE_TITLE}&path=${path}`;

          return item;
        }),
      };

      set(PAGE_ID, guideData, 3 * DAY);

      this.setData(guideData);
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
    const words = await search<string[]>({
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
    this.$go(`search?name=${PAGE_ID}&word=${detail.value}`);
  },
});
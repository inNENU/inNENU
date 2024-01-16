import { $Page, get, set } from "@mptool/all";

import type {
  GridComponentConfig,
  GridComponentItemConfig,
  ListComponentItemConfig,
} from "../../../typings/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { DAY } from "../../config/index.js";
import { info } from "../../state/info.js";
import { getIdentity } from "../../state/user.js";
import { getResource } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { search } from "../../utils/search.js";
import { TabData } from "../typings.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "intro";
const PAGE_TITLE = "东师介绍";

interface IntroData {
  items: (Omit<GridComponentConfig, "tag"> & Record<string, unknown>)[];
  more: (Omit<GridComponentConfig, "tag"> & Record<string, unknown>)[];
}

const defaultData = get<IntroData | undefined>(PAGE_ID);

$Page(PAGE_ID, {
  data: {
    theme: info.theme,

    statusBarHeight: info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    menuSpace: info.env === "app" ? 10 : 90,

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

  async onPullDownRefresh() {
    this.setPage();
    await checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({ title: PAGE_TITLE, path: "/pages/intro/intro" }),

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
    if (globalData.settings) {
      const data = await getResource<TabData>("function/data/tab");

      const { id, type, location } = getIdentity();

      const { "intro-page": introPageConfig } = globalData.settings;

      const introConfig = introPageConfig[id] || introPageConfig.default;

      const config = Object.entries(data);

      const more = introConfig.more.map((item) => {
        const record = config.find(([key]) => key === item)![1];

        return {
          header: record.name,
          path: record.path,
          items: record.items
            .map((item) => {
              if (type === "under" && "under" in item) {
                if (item.under === null) return null;
                item.url = `info?from=${PAGE_TITLE}&id=${item.under}`;
              } else if (type === "post" && "post" in item) {
                if (item.post === null) return null;
                item.url = `info?from=${PAGE_TITLE}&id=${item.post}`;
              } else if (location === "benbu" && "benbu" in item) {
                if (item.benbu === null) return null;
                item.url = `info?from=${PAGE_TITLE}&id=${item.benbu}`;
              } else if (location === "jingyue" && "jingyue" in item) {
                if (item.jingyue === null) return null;
                item.url = `info?from=${PAGE_TITLE}&id=${item.jingyue}`;
              } else if (item.path)
                item.url = `info?from=${PAGE_TITLE}&id=${item.path}`;

              return item;
            })
            .filter((item): item is GridComponentItemConfig => item !== null),
        };
      });

      const introData = {
        items: introConfig.items.map((item) => {
          const record = config.find(([key]) => key === item)![1];

          return {
            header: record.name,
            items: record.items
              .map((item) => {
                if (type === "under" && "under" in item) {
                  if (item.under === null) return null;
                  item.url = `info?from=${PAGE_TITLE}&id=${item.under}`;
                } else if (type === "post" && "post" in item) {
                  if (item.post === null) return null;
                  item.url = `info?from=${PAGE_TITLE}&id=${item.post}`;
                } else if (item.path)
                  item.url = `info?from=${PAGE_TITLE}&id=${item.path}`;

                return item;
              })
              .filter((item): item is GridComponentItemConfig => item !== null),
          };
        }),
        more,
        moreItems: more.map(({ header, path }) => {
          const item: ListComponentItemConfig = { text: header };

          if (path) item.url = `info?from=${PAGE_TITLE}&path=${path}`;

          return item;
        }),
      };

      set(PAGE_ID, introData, 3 * DAY);

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
    this.$go(`search?type=${PAGE_ID}&word=${detail.value}`);
  },

  toggleFeature() {
    const isFlat = get<boolean>("flat-feature-panel") ?? true;

    this.$emit("feature-panel", !isFlat);
    set("flat-feature-panel", !isFlat);
  },
});

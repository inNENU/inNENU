import { $Page, get, set } from "@mptool/all";

import type { PageStateWithContent } from "../../../typings/index.js";
import type { App } from "../../app.js";
import {
  DAY,
  WIDGET_KEY,
  appCoverPrefix,
  appName,
} from "../../config/index.js";
import { searchMiniApp } from "../../service/index.js";
import { getIdentity, info } from "../../state/index.js";
import {
  checkResource,
  getPageColor,
  resolvePage,
  setPage,
  showNotice,
} from "../../utils/index.js";
import { DEFAULT_WIDGETS } from "../../widgets/config.js";
import type { WidgetConfig } from "../../widgets/utils.js";

const { globalData } = getApp<App>();

const PAGE_ID = "main";

const defaultPage = resolvePage(
  { id: PAGE_ID },
  get<PageStateWithContent>(PAGE_ID) ||
    ({
      title: "首页",
      grey: true,
      hidden: true,
      content: [{ tag: "loading" }],
    } as PageStateWithContent),
) as PageStateWithContent;

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    statusBarHeight: info.statusBarHeight,
    id: getIdentity().id,

    /** 候选词 */
    words: [] as string[],

    page: defaultPage,

    menuSpace: info.platform === "android" || info.platform === "ios" ? 90 : 10,
  },

  onLoad() {
    setPage(
      {
        option: { id: PAGE_ID },
        ctx: this,
        handle: true,
      },
      this.data.page,
    );

    this.$on("settings", () => this.renderPage());
  },

  onShow() {
    const widgets = get<WidgetConfig[]>(WIDGET_KEY) || DEFAULT_WIDGETS;

    this.setData({ widgets });
    this.renderPage();
    showNotice(PAGE_ID);
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);

    // 执行 tab 页预加载
    ["function", "guide", "intro", "user"].forEach((item) => {
      this.$preload(item);
    });
  },

  async onPullDownRefresh() {
    this.renderPage();
    await checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: appName,
    path: "/pages/main/main",
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({
    title: appName,
  }),

  onAddToFavorites: () => ({
    title: appName,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    this.$off("theme", this.setTheme);
  },

  setTheme(theme: string): void {
    this.setData({ color: getPageColor(this.data.page.grey), theme });
  },

  loadPage(): PageStateWithContent | null {
    if (!globalData.settings) return null;

    const { id } = getIdentity();
    const { "main-page": mainConfig, "main-presets": mainPresets } =
      globalData.settings;

    const configName = mainConfig[id] || mainConfig.default;

    const mainPage = {
      title: "首页",
      grey: true,
      hidden: true,
      content: mainPresets[configName],
    };

    set(PAGE_ID, mainPage, 3 * DAY);

    return mainPage;
  },

  renderPage(): void {
    try {
      const pageData = this.loadPage();

      if (pageData) setPage({ ctx: this, option: { id: PAGE_ID } }, pageData);
    } catch (err) {
      setPage(
        { ctx: this, option: { id: PAGE_ID } },
        get(PAGE_ID) || this.data.page,
      );
    }

    this.setData({ id: getIdentity().id });
  },

  /**
   * 在搜索框中输入时触发的函数
   *
   * @param value 输入的搜索词
   */
  async searching({ detail: { value } }: WechatMiniprogram.Input) {
    const words = await searchMiniApp<string[]>({
      scope: "all",
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
    this.$go(`search?type=all&word=${detail.value}`);
  },
});

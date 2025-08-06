import { $Page, get, logger, put, set, take } from "@mptool/all";

import type { PageStateWithContent } from "../../../typings/index.js";
import { preloadSkyline } from "../../api/index.js";
import { checkResource } from "../../app/index.js";
import type { App } from "../../app.js";
import { DAY, appCoverPrefix } from "../../config/index.js";
import { getIdentity, info, menuSpace, windowInfo } from "../../state/index.js";
import {
  getPageColor,
  resolvePage,
  setPage,
  showNotice,
} from "../../utils/index.js";

const { globalData } = getApp<App>();

const PAGE_ID = "function";
const PAGE_TITLE = "功能大厅";
const PAGE_KEY = `${PAGE_ID}-page-data`;

let defaultPage: PageStateWithContent | null = null;

try {
  defaultPage = resolvePage(
    { id: PAGE_ID },
    get<PageStateWithContent>(PAGE_KEY),
  ) as PageStateWithContent | null;
} catch (err) {
  logger.error("加载功能大厅失败", err);
} finally {
  if (!defaultPage) {
    defaultPage = {
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
      content: [],
    } as PageStateWithContent;
  }
}

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    statusBarHeight: windowInfo.statusBarHeight,
    menuSpace,

    /** 页面数据 */
    page: defaultPage,
  },

  onPreload() {
    const data = this.loadPage();

    if (data) put(PAGE_ID, resolvePage({ id: PAGE_ID }, data));

    logger.debug(
      `Function page loading time: ${Date.now() - info.startupTime}ms`,
    );
  },

  onLoad() {
    const preloadData = take<PageStateWithContent>(PAGE_ID);

    setPage(
      { option: { id: PAGE_ID }, ctx: this, handle: Boolean(preloadData) },
      preloadData || this.data.page,
    );

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

  loadPage(): PageStateWithContent | null {
    if (!globalData.settings) return null;

    const { id } = getIdentity();
    const {
      "function-page": functionConfig,
      "function-presets": functionPresets,
    } = globalData.settings;

    const configName = functionConfig[id] || functionConfig.default;

    const functionPage = {
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
      content: functionPresets[configName],
    };

    set(PAGE_KEY, functionPage, 3 * DAY);

    return functionPage;
  },

  setPage(): void {
    try {
      const pageData = this.loadPage();

      if (pageData) setPage({ ctx: this, option: { id: PAGE_ID } }, pageData);
    } catch {
      setPage(
        { ctx: this, option: { id: PAGE_ID } },
        get(PAGE_ID) || this.data.page,
      );
    }
  },

  /**
   * 跳转到搜索页面
   *
   * @param value 输入的搜索词
   */
  search({ detail }: WechatMiniprogram.Input) {
    this.$go(`search?query=${detail.value}`);
  },
});

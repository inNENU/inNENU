import { $Page, get, put, set, take } from "@mptool/all";

import type { PageDataWithContent } from "../../../typings/index.js";
import { requestJSON } from "../../api/net.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { DAY } from "../../utils/constant.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { getIdentity } from "../../utils/settings.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "function";
const PAGE_TITLE = "功能大厅";

const defaultPage = <PageDataWithContent>resolvePage(
  { id: PAGE_ID },
  get<PageDataWithContent>(PAGE_ID) ||
    <PageDataWithContent>{
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
      content: [{ tag: "loading" }],
    },
);

$Page(PAGE_ID, {
  data: {
    /** 页面数据 */
    page: defaultPage,

    theme: globalData.theme,
  },

  async onPreload() {
    const data = await this.loadPage();

    if (data) put(PAGE_ID, resolvePage({ id: PAGE_ID }, data));

    console.debug(
      `Function page loading time: ${
        new Date().getTime() - globalData.startupTime
      }ms`,
    );
  },

  onLoad() {
    const preloadData = take<PageDataWithContent>(PAGE_ID);

    setPage(
      { option: { id: PAGE_ID }, ctx: this, handle: Boolean(preloadData) },
      preloadData || this.data.page,
    );

    this.$on("data", () => this.setPage());
  },

  async onShow() {
    popNotice(PAGE_ID);

    await this.setPage();
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);
  },

  async onPullDownRefresh() {
    await this.setPage();
    checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/pages/function/function",
  }),

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

  async loadPage(): Promise<PageDataWithContent | null> {
    const test = wx.getStorageSync<boolean | undefined>("test");

    if (test)
      return await requestJSON<PageDataWithContent>(
        `d/config/${globalData.appID}/test/function`,
      );

    if (!globalData.data) return null;

    const identify = getIdentity(globalData.account);
    const {
      "function-page": functionConfig,
      "function-presets": functionPresets,
    } = globalData.data;

    const configName = functionConfig[identify] || functionConfig.default;

    const functionPage = {
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
      content: functionPresets[configName],
    };

    set(PAGE_ID, functionPage, 3 * DAY);

    return functionPage;
  },

  async setPage(): Promise<void> {
    try {
      const pageData = await this.loadPage();

      if (pageData) setPage({ ctx: this, option: { id: PAGE_ID } }, pageData);
    } catch (err) {
      setPage(
        { ctx: this, option: { id: PAGE_ID } },
        get(PAGE_ID) || this.data.page,
      );
    }
  },
});

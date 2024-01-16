import { $Page, get, put, set, take } from "@mptool/all";

import { footer } from "./info.js";
import type { PageDataWithContent } from "../../../typings/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, appName, description } from "../../config/index.js";
import { DAY } from "../../config/index.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { reportInfo } from "../../utils/report.js";
import { checkResource } from "../../utils/resource.js";

const plugin = <{ openComment: (option: unknown) => void }>(
  requirePlugin("wxacommentplugin")
);
const { globalData } = getApp<AppOption>();

const PAGE_ID = "user";
const PAGE_TITLE = "我的东师";

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
    page: defaultPage,

    userName: appName,

    logo: "/frameset/placeholder.png",
    footer: {
      author: "",
      desc: footer,
    },

    theme: globalData.theme,
    statusBarHeight: globalData.info.statusBarHeight,
  },

  onPreload() {
    const data = this.loadPage();

    if (data) put(PAGE_ID, resolvePage({ id: PAGE_ID }, data));

    console.debug(
      `User page loading time: ${Date.now() - globalData.startupTime}ms`,
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

  onShow() {
    const { account, userInfo } = globalData;

    this.setData({
      login: account !== null,
      userName: userInfo?.name || (account ? appName : "未登录"),
      desc: account === null ? description : "以下是你的今日概览",
    });
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

  onShareAppMessage: () => ({
    title: appName,
    path: "/pages/main/main",
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({ title: appName }),

  onAddToFavorites: () => ({
    title: appName,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    this.$off("theme", this.setTheme);
  },

  rate() {
    plugin.openComment({});
  },

  setTheme(theme: string): void {
    this.setData({ color: getColor(this.data.page.grey), theme });
  },

  loadPage(): PageDataWithContent | null {
    if (!globalData.settings) return null;

    const userPage = {
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
      content: globalData.settings.user,
    };

    set(PAGE_ID, userPage, 3 * DAY);

    return userPage;
  },

  setPage(): void {
    try {
      const pageData = this.loadPage();

      if (pageData) setPage({ ctx: this, option: { id: PAGE_ID } }, pageData);
    } catch (err) {
      setPage(
        { ctx: this, option: { id: PAGE_ID } },
        get(PAGE_ID) || this.data.page,
      );
    }
  },

  reportInfo,
});

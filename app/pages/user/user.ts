import { $Page, get, put, set, take } from "@mptool/all";

import { footer } from "./info.js";
import type { PageStateWithContent } from "../../../typings/index.js";
import { checkResource } from "../../app/index.js";
import type { App } from "../../app.js";
import {
  DAY,
  appCoverPrefix,
  appName,
  description,
} from "../../config/index.js";
import { reportUserInfo } from "../../service/index.js";
import { info, user } from "../../state/index.js";
import {
  getPageColor,
  resolvePage,
  setPage,
  showNotice,
} from "../../utils/index.js";

const { globalData } = getApp<App>();

const PAGE_ID = "user";
const PAGE_TITLE = "我的东师";

let defaultPage: PageStateWithContent | null = null;

try {
  defaultPage = resolvePage(
    { id: PAGE_ID },
    get<PageStateWithContent>(`${PAGE_ID}-page-data`),
  ) as PageStateWithContent | null;
} catch (err) {
  console.error(err);
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
    page: defaultPage,

    userName: appName,

    logo: "/frameset/placeholder.png",
    footer: {
      author: "",
      desc: footer,
    },

    theme: info.theme,
    statusBarHeight: info.statusBarHeight,
  },

  onPreload() {
    const data = this.loadPage();

    if (data) put(PAGE_ID, resolvePage({ id: PAGE_ID }, data));

    console.debug(`User page loading time: ${Date.now() - info.startupTime}ms`);
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
    const { account, info } = user;

    this.setData({
      login: account !== null,
      userName: info?.name || (account ? appName : "未登录"),
      desc: account === null ? description : "以下是你的今日概览",
    });
    showNotice(PAGE_ID);

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
    (
      requirePlugin("wxacommentplugin") as {
        openComment: (option: unknown) => void;
      }
    ).openComment({});
  },

  goToSettings() {
    this.$go("settings");
  },

  setTheme(theme: string): void {
    this.setData({ color: getPageColor(this.data.page.grey), theme });
  },

  loadPage(): PageStateWithContent | null {
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

  reportUserInfo,
});

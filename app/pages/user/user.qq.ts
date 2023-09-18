import { $Page, get, put, set, take } from "@mptool/all";

import type { PageDataWithContent } from "../../../typings/index.js";
import { requestJSON } from "../../api/net.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, appName, assets } from "../../config/index.js";
import { DAY } from "../../utils/constant.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";

const { globalData } = getApp<AppOption>();
const { envName, version } = globalData;

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

    logo: `${assets}img/inNENU.png`,
    footer: {
      author: "",
      desc: `当前版本: ${version}\n${envName}由 Mr.Hope 个人制作，如有错误还请见谅`,
    },

    theme: globalData.theme,
    statusBarHeight: globalData.info.statusBarHeight,
  },

  async onPreload() {
    const data = await this.loadPage();

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

  async onShow() {
    const { account, userInfo } = globalData;

    this.setData({
      login: account !== null,
      userName: userInfo?.name || (account ? appName : "未登录"),
      desc: account === null ? "in 东师，就用 in 东师" : "以下是你的今日概览",
    });
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

  setTheme(theme: string): void {
    this.setData({ color: getColor(this.data.page.grey), theme });
  },

  async loadPage(): Promise<PageDataWithContent | null> {
    const test = wx.getStorageSync<boolean | undefined>("test");

    if (test)
      return await requestJSON<PageDataWithContent>(
        `d/config/${globalData.appID}/test/user`,
      );

    if (!globalData.data) return null;

    const userPage = {
      title: PAGE_TITLE,
      grey: true,
      hidden: true,
      content: globalData.data.user,
    };

    set(PAGE_ID, userPage, 3 * DAY);

    return userPage;
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

  addToDesktop() {
    wx.saveAppToDesktop();
  },
});

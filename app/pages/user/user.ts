import { $Page, get, logger, put, set, take } from "@mptool/all";

import { footer } from "./info.js";
import type { PageStateWithContent } from "../../../typings/index.js";
import { checkResource } from "../../app/index.js";
import type { App } from "../../app.js";
import {
  DAY,
  appCoverPrefix,
  appName,
  description,
  logo,
} from "../../config/index.js";
import { reportUserInfo } from "../../service/index.js";
import { info, user, windowInfo } from "../../state/index.js";
import {
  getPageColor,
  resolvePage,
  setPage,
  showNotice,
} from "../../utils/index.js";

const { globalData } = getApp<App>();

const PAGE_ID = "user";
const PAGE_TITLE = "我的东师";
const PAGE_KEY = `${PAGE_ID}-page-data`;

let defaultPage: PageStateWithContent | null = null;

try {
  defaultPage = resolvePage(
    { id: PAGE_ID },
    get<PageStateWithContent>(PAGE_KEY),
  ) as PageStateWithContent | null;
} catch (err) {
  logger.error("加载用户页失败", err);
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

    logo,
    footer: {
      author: "",
      desc: footer,
    },

    theme: info.theme,
    statusBarHeight: windowInfo.statusBarHeight,
  },

  onPreload() {
    const data = this.loadPage();

    if (data) put(PAGE_ID, resolvePage({ id: PAGE_ID }, data));

    logger.debug(`User page loading time: ${Date.now() - info.startupTime}ms`);
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

    set(PAGE_KEY, userPage, 3 * DAY);

    return userPage;
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

  reportInfo() {
    reportUserInfo();
  },

  openOfficial() {
    if (wx.openOfficialAccountProfile)
      wx.openOfficialAccountProfile({
        username: "gh_b4378a2c36ae",
        fail: () => {
          this.$go("qrcode");
        },
      });
    else this.$go("qrcode");
  },

  // Note: For Wechat only
  openChannel() {
    wx.openChannelsUserProfile({
      finderUserName: "sphQlMRqDF84Orm",
    });
  },

  // NOTE: For QQ Only
  addToDesktop() {
    wx.saveAppToDesktop();
  },
});

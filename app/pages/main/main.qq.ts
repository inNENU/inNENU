import { $Page } from "@mptool/enhance";

import { type PageDataWithContent } from "../../../typings/index.js";
import { requestJSON } from "../../api/net.js";
import { getDarkmode } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix, appName } from "../../config/info.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { search } from "../../utils/search.js";
import { refreshPage } from "../../utils/tab.js";

const { globalData } = getApp<AppOption>();

$Page("main", {
  data: {
    theme: globalData.theme,

    statusBarHeight: globalData.info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    page: <PageDataWithContent>{
      title: "首页",
      id: "main",
      grey: true,
      hidden: true,
      content: [{ tag: "loading" }],
    },

    menuSpace: globalData.env === "app" ? 10 : 90,
  },

  onRegister() {
    console.info(
      "Main Page registerd: ",
      new Date().getTime() - globalData.startupTime,
      "ms",
    );
    const page = resolvePage(
      { id: "main" },
      wx.getStorageSync<PageDataWithContent | undefined>("main") ||
        this.data.page,
    ) as PageDataWithContent;

    if (page) this.data.page = page;
  },

  onLoad() {
    setPage({ option: { id: "main" }, ctx: this, handle: true });
  },

  onShow() {
    const darkmode = getDarkmode();

    refreshPage("main")
      .then((data) => {
        setPage({ ctx: this, option: { id: "main" } }, data);
      })
      .catch(() => {
        setPage(
          { ctx: this, option: { id: "main" } },
          wx.getStorageSync("main") || this.data.page,
        );
      });

    const suffix = darkmode ? "dark" : "light";

    wx.setTabBarItem({
      index: 0,
      text: "首页",
      iconPath: `/icon/tab/home-${suffix}.png`,
      selectedIconPath: `/icon/tab/home.png`,
    });
    wx.setTabBarItem({
      index: 1,
      text: "东师介绍",
      iconPath: `/icon/tab/intro-${suffix}.png`,
      selectedIconPath: `/icon/tab/intro.png`,
    });
    wx.setTabBarItem({
      index: 2,
      text: "东师指南",
      iconPath: `/icon/tab/guide-${suffix}.png`,
      selectedIconPath: `/icon/tab/guide.png`,
    });
    wx.setTabBarItem({
      index: 3,
      text: "功能大厅",
      iconPath: `/icon/tab/function-${suffix}.png`,
      selectedIconPath: `/icon/tab/function.png`,
    });
    wx.setTabBarItem({
      index: 4,
      text: "我的东师",
      iconPath: `/icon/tab/user-${suffix}.png`,
      selectedIconPath: `/icon/tab/user.png`,
    });
    wx.setTabBarStyle({
      color: darkmode ? "#e6e6e6" : "#333333",
      backgroundColor: darkmode ? "#000000" : "#ffffff",
      borderStyle: darkmode ? "white" : "black",
    });

    popNotice("main");
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);

    // 执行 tab 页预加载
    ["function", "guide", "intro", "user"].forEach((x) => {
      requestJSON(`r/config/${globalData.appID}/${globalData.version}/${x}`)
        .then((data) => {
          wx.setStorageSync(x, data);
          this.$preload(`${x}?id=${x}`);
        })
        .catch(() => {
          this.$preload(`${x}?id=${x}`);
        });
    });
  },

  onPullDownRefresh() {
    refreshPage("main").then((data) => {
      setPage({ ctx: this, option: { id: "main" } }, data);
    });

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
    this.setData({ color: getColor(this.data.page.grey), theme });
  },

  /**
   * 在搜索框中输入时触发的函数
   *
   * @param value 输入的搜索词
   */
  searching({ detail: { value } }: WechatMiniprogram.Input) {
    search<string[]>({ scope: "all", type: "word", word: value }).then(
      (words) => this.setData({ words }),
    );
  },

  /**
   * 跳转到搜索页面
   *
   * @param value 输入的搜索词
   */
  search({ detail }: WechatMiniprogram.Input) {
    this.$go(`search?name=all&word=${detail.value}`);
  },
});

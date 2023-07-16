import { $Page, put, take } from "@mptool/all";

import type { PageDataWithContent } from "../../../typings/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { refreshPage } from "../../utils/tab.js";

const { globalData } = getApp<AppOption>();

$Page("function", {
  data: {
    theme: globalData.theme,

    /** 页面数据 */
    page: {
      title: "功能大厅",
      grey: true,
      hidden: true,
    },
  },

  onPreload(res) {
    put(
      "function",
      resolvePage(res, wx.getStorageSync("function") || this.data.page),
    );
    console.info(
      `Function page loading time: ${
        new Date().getTime() - globalData.startupTime
      }ms`,
    );
  },

  onLoad() {
    const preloadData = take<PageDataWithContent>("function");

    setPage(
      { option: { id: "function" }, ctx: this, handle: Boolean(preloadData) },
      preloadData || wx.getStorageSync("function") || this.data.page,
    );
  },

  onShow() {
    refreshPage("function").then((data) => {
      setPage({ ctx: this, option: { id: "function" } }, data);
    });
    popNotice("function");
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);
  },

  onPullDownRefresh() {
    refreshPage("function").then((data) => {
      setPage({ ctx: this, option: { id: "function" } }, data);
    });
    checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: "功能大厅",
    path: "/pages/function/function",
  }),

  onShareTimeline: () => ({ title: "功能大厅" }),

  onAddToFavorites: () => ({
    title: "功能大厅",
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    this.$off("theme", this.setTheme);
  },

  setTheme(theme: string): void {
    this.setData({ color: getColor(this.data.page.grey), theme });
  },
});

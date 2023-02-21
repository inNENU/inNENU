import { $Page } from "@mptool/enhance";
import { put, take } from "@mptool/file";

import { type PageDataWithContent } from "../../../typings";
import { type AppOption } from "../../app";
import { appCoverPrefix } from "../../utils/config";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page";
import { checkResource } from "../../utils/resource";
import { search } from "../../utils/search";
import { refreshPage } from "../../utils/tab";

const { globalData } = getApp<AppOption>();

$Page("guide", {
  data: {
    theme: globalData.theme,

    statusBarHeight: globalData.info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    /** 页面数据 */
    page: {
      title: "东师指南",
      grey: true,
      hidden: true,
    },
  },

  onPreload(res) {
    put(
      "guide",
      resolvePage(res, wx.getStorageSync("guide") || this.data.page)
    );
    console.info(
      `Guide page load time: ${new Date().getTime() - globalData.date}ms`
    );
  },

  onLoad() {
    const preloadData = take<PageDataWithContent>("guide");

    setPage(
      { option: { id: "guide" }, ctx: this, handle: Boolean(preloadData) },
      preloadData || wx.getStorageSync("guide") || this.data.page
    );
  },

  onShow() {
    refreshPage("guide").then((data) => {
      setPage({ ctx: this, option: { id: "guide" } }, data);
    });
    popNotice("guide");
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);
  },

  onPullDownRefresh() {
    refreshPage("guide").then((data) => {
      setPage({ ctx: this, option: { id: "guide" } }, data);
    });
    checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({ title: "东师指南", path: "/pages/guide/guide" }),

  onShareTimeline: () => ({ title: "东师指南" }),

  onAddToFavorites: () => ({
    title: "东师指南",
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
    search<string[]>({ scope: "guide", type: "word", word: value }).then(
      (words) => this.setData({ words })
    );
  },

  /**
   * 跳转到搜索页面
   *
   * @param value 输入的搜索词
   */
  search({ detail }: WechatMiniprogram.Input) {
    this.$go(`search?name=guide&word=${detail.value}`);
  },
});

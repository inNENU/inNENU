import { $Page } from "@mptool/enhance";
import { put, take } from "@mptool/file";

import {
  type FunctionalListComponentConfig,
  type PageDataWithContent,
  type PickerListComponentItemConfig,
} from "../../../typings/index.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix, appName } from "../../config/info.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { refreshPage } from "../../utils/tab.js";

const { globalData } = getApp<AppOption>();

$Page("user", {
  data: {
    logo: "/frameset/placeholder.png",
    page: <PageDataWithContent>{
      title: "我的东师",
      grey: true,
      hidden: true,
      content: [{ tag: "loading" }],
    },

    footer: {
      author: "",
      desc: `当前版本: ${globalData.version}\nMr.Hope 已授权东北师范大学团委融媒体中心使用小程序代码。\n小程序由 Mr.Hope 个人制作，如有错误还请见谅`,
    },

    theme: globalData.theme,
    statusBarHeight: globalData.info.statusBarHeight,
    userName: appName,
  },

  onPreload(res) {
    put("user", resolvePage(res, wx.getStorageSync("user") || this.data.page));
    console.info(
      `User page loading time: ${
        new Date().getTime() - globalData.startupTime
      }ms`,
    );
  },

  onLoad() {
    const preloadData = take<PageDataWithContent>("user");

    setPage(
      { option: { id: "user" }, ctx: this, handle: Boolean(preloadData) },
      preloadData || wx.getStorageSync("user") || this.data.page,
    );
  },

  onShow() {
    const { account, userInfo } = globalData;

    refreshPage("user").then((data) => {
      setPage({ ctx: this, option: { id: "user" } }, data);
    });
    this.setData({
      login: account !== null,
      userName: userInfo?.name || (account ? appName : "未登录"),
      desc: "以下是你的今日概览" || "走出半生，归来仍是 —— 东师青年",
    });
    popNotice("user");
  },

  onPullDownRefresh() {
    refreshPage("user").then((data) => {
      setPage({ ctx: this, option: { id: "user" } }, data);
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

  onShareTimeline: () => ({ title: appName }),

  onAddToFavorites: () => ({
    title: appName,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  updateTheme(value: string) {
    // get the updated theme
    const theme = (
      (
        (this.data.page.content[1] as FunctionalListComponentConfig)
          .items[0] as PickerListComponentItemConfig
      ).select as string[]
    )[Number(value)];

    globalData.theme = theme;
    wx.setStorageSync("theme", theme);
    this.setData({ color: getColor(this.data.page.grey), theme });
    this.$emit("theme", theme);

    // debug
    console.info(`Switched to ${theme} theme`);
  },
});

import { $Page } from "@mptool/enhance";
import { put, take } from "@mptool/file";

import { checkResUpdate } from "../../utils/app";
import { tip } from "../../utils/api";
import { getImagePrefix, getTitle } from "../../utils/config";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page";
import { refreshPage } from "../../utils/tab";

import type { AppOption } from "../../app";
import type {
  FunctionalListComponentConfig,
  PageDataWithContent,
  PickerListComponentItemConfig,
} from "../../../typings";

const { globalData } = getApp<AppOption>();

$Page("user", {
  data: {
    title: "in 东师",
    logo: "/frameset/placeholder.png",
    desc: "in 东师，就用 in 东师",
    page: <PageDataWithContent>{
      title: "我的东师",
      grey: true,
      hidden: true,
      content: [{ tag: "loading" }],
    },

    footer: {
      author: "",
      desc: `当前版本: ${globalData.version}\n小程序由 Mr.Hope 个人制作，如有错误还请见谅`,
    },

    theme: globalData.theme,
    statusBarHeight: globalData.info.statusBarHeight,
  },

  onPreload(res) {
    put("user", resolvePage(res, wx.getStorageSync("user") || this.data.page));
    console.info(
      `User page loading time: ${new Date().getTime() - globalData.date}ms`
    );
  },

  onLoad() {
    const preloadData = take<PageDataWithContent>("user");

    setPage(
      { option: { id: "user" }, ctx: this, handle: Boolean(preloadData) },
      preloadData || wx.getStorageSync("user") || this.data.page
    );
  },

  onShow() {
    refreshPage("user").then((data) => {
      setPage({ ctx: this, option: { id: "user" } }, data);
    });
    popNotice("user");
  },

  onPullDownRefresh() {
    refreshPage("user").then((data) => {
      setPage({ ctx: this, option: { id: "user" } }, data);
    });
    checkResUpdate();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: getTitle(),
    path: "/pages/main/main",
    imageUrl: `${getImagePrefix()}Share.png`,
  }),

  onShareTimeline: () => ({ title: getTitle() }),

  onAddToFavorites: () => ({
    title: getTitle(),
    imageUrl: `${getImagePrefix()}.jpg`,
  }),

  openProfile() {
    if (wx.canIUse("openChannelsUserProfile"))
      wx.openChannelsUserProfile?.({
        finderUserName: "sphYDhg2G2Qp1Mt",
      });
    else tip("请升级微信版本");
  },

  addToDesktop() {
    wx.saveAppToDesktop({
      success: () => {
        console.log("Add to desktop success!");
      },
    });
  },

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

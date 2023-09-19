import { $Page } from "@mptool/all";

import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor } from "../../utils/page.js";
import { reportInfo } from "../../utils/report.js";
import { resetApp } from "../../utils/reset.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "action";
const PAGE_TITLE = "功能页";

$Page(PAGE_ID, {
  onLoad(options) {
    const { darkmode, theme } = globalData;
    const action = options.scene
      ? decodeURIComponent(options.scene)
      : options.action;

    this.setData({
      darkmode,
      theme,
      color: getColor(),
      ...(action ? { [action]: true } : {}),
    });
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/pages/action/action?action=all",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE, query: "action=all" }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
    query: "action=all",
  }),

  /** 初始化小程序 */
  resetApp,

  pathInput({ detail }: WechatMiniprogram.Input) {
    this.setData({ path: detail.value });
  },

  reportInfo,
});

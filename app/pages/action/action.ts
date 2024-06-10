import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../config/index.js";
import { info } from "../../state/index.js";
import { getColor, reportInfo, resetApp } from "../../utils/index.js";

const PAGE_ID = "action";
const PAGE_TITLE = "功能页";

$Page(PAGE_ID, {
  onLoad(options) {
    const { darkmode, theme } = info;
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

  /** 初始化 */
  resetApp,

  pathInput({ detail }: WechatMiniprogram.Input) {
    this.setData({ path: detail.value });
  },

  reportInfo,
});

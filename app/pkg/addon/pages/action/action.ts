import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { reportUserInfo } from "../../../../service/index.js";
import { info } from "../../../../state/index.js";
import { getPageColor } from "../../../../utils/index.js";
import { rateApp, resetApp } from "../../utils/index.js";

const PAGE_ID = "action";
const PAGE_TITLE = "功能页";

$Page(PAGE_ID, {
  state: {
    action: "",
  },

  onLoad(options) {
    const { darkmode, theme } = info;
    const action = options.scene
      ? decodeURIComponent(options.scene)
      : options.action;

    this.setData({
      darkmode,
      theme,
      color: getPageColor(),
      canExit: typeof wx.restartMiniProgram === "function",
      ...(action ? { [action]: true } : {}),
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: PAGE_TITLE,
      path: `/pkg/addon/pages/action/action?action=${this.state.action}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return { title: PAGE_TITLE, query: `action=${this.state.action}` };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: PAGE_TITLE,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `action=${this.state.action}`,
    };
  },

  rateApp() {
    this.reportInfo({ type: "rate" });
    rateApp();
  },

  /** 初始化 */
  resetApp,

  pathInput({ detail }: WechatMiniprogram.Input) {
    this.setData({ path: detail.value });
  },

  reportInfo: reportUserInfo,
});

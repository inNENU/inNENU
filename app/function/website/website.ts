import { $Page } from "@mptool/enhance";

import { type AppOption } from "../../app.js";
import { getWindowInfo, modal } from "../../utils/api.js";
import { appCoverPrefix } from "../../utils/config.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

$Page("website", {
  data: {
    config: <unknown[]>[],
  },

  onNavigate() {
    ensureJSON("function/website/index");
  },

  onLoad() {
    getJSON<unknown[]>("function/website/index").then((config) => {
      const info = getWindowInfo();

      this.setData({
        config,
        height: info.windowHeight - info.statusBarHeight - 160,
      });
    });

    popNotice("account");
  },

  onShareAppMessage: () => ({
    title: "东师网站",
    path: `/function/website/website`,
  }),

  onShareTimeline: () => ({ title: "东师网站" }),

  onAddToFavorites: () => ({
    title: "东师网站",
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - globalData.info.statusBarHeight - 229,
    });
  },

  copy({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { link: string }
  >) {
    wx.setClipboardData({
      data: currentTarget.dataset.link,
      success: () => {
        modal(
          "功能受限",
          "受到小程序限制，无法直接打开网页，网址已复制到剪切板"
        );
      },
    });
  },
});

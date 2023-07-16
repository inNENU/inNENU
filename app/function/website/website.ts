import { $Page } from "@mptool/all";

import { showModal } from "../../api/index.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "website";
const PAGE_TITLE = "东师网站";

$Page(PAGE_ID, {
  data: {
    config: <unknown[]>[],
  },

  onNavigate() {
    ensureJSON("function/website/index");
  },

  onLoad() {
    getJSON<unknown[]>("function/website/index").then((config) => {
      this.setData({
        config,
        height:
          globalData.info.windowHeight - globalData.info.statusBarHeight - 160,
      });
    });

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: `/function/website/website`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
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
        showModal(
          "功能受限",
          "受到小程序限制，无法直接打开网页，网址已复制到剪切板",
        );
      },
    });
  },
});

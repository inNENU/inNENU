import { $Page } from "@mptool/all";

import type { AppOption } from "../../app.js";
import { ensureResource, getResource } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "website";

$Page("website", {
  data: {
    config: <unknown[]>[],
  },

  onNavigate() {
    ensureResource("function/website/index");
  },

  onLoad() {
    getResource<unknown[]>("function/website/index").then((config) => {
      this.setData({
        config,
        height:
          globalData.info.windowHeight - globalData.info.statusBarHeight - 160,
      });
    });

    popNotice(PAGE_ID);
  },

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - globalData.info.statusBarHeight - 160,
    });
  },

  copy({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { link: string }
  >) {
    wx.miniapp.openUrl({ url: currentTarget.dataset.link });
  },
});

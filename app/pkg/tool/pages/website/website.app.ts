import { $Page } from "@mptool/all";

import { info } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "website";

$Page("website", {
  data: {
    config: [] as unknown[],
  },

  onNavigate() {
    ensureJson("function/website/index");
  },

  onLoad() {
    getJson<unknown[]>("function/website/index").then((config) => {
      this.setData({
        config,
        height: info.windowHeight - info.statusBarHeight - 160,
      });
    });

    showNotice(PAGE_ID);
  },

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - info.statusBarHeight - 160,
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

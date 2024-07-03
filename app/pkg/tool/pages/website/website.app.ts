import { $Page } from "@mptool/all";

import { info } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "website";

interface WebsiteConfig {
  name: string;
  website: { name: string; desc: string; link: string }[];
}

$Page("website", {
  data: {
    config: [] as WebsiteConfig[],
  },

  onNavigate() {
    ensureJson("function/website/index");
  },

  onLoad() {
    getJson<WebsiteConfig[]>("function/website/index").then((config) => {
      this.setData({
        titles: config.map((item) => item.name),
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

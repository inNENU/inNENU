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
    title: "东师网站",
    config: [] as WebsiteConfig[],
    theme: info.theme,
    titles: [] as string[],
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
        theme: info.theme,
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

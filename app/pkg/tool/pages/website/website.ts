import { $Page, showModal, writeClipboard } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { info, windowInfo } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "website";
const PAGE_TITLE = "东师网站";

interface WebsiteConfig {
  name: string;
  website: { name: string; desc: string; link: string }[];
}

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,
    theme: info.theme,
    config: [] as WebsiteConfig[],
    titles: [] as string[],
  },

  onNavigate() {
    ensureJson("function/website/index");
  },

  onLoad() {
    this.setData({
      theme: info.theme,
      // NOTE: Compact for skyline renderer, which does not support media queries.
      height: windowInfo.windowHeight - windowInfo.statusBarHeight - 160,
    });

    getJson<WebsiteConfig[]>("function/website/index").then((config) => {
      this.setData({
        titles: config.map((item) => item.name),
        config,
      });
    });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - windowInfo.statusBarHeight - 160,
    });
  },

  copy({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { link: string }
  >) {
    writeClipboard(currentTarget.dataset.link).then(() => {
      showModal(
        "功能受限",
        "受到小程序限制，无法直接打开网页，网址已复制到剪切板",
      );
    });
  },
});

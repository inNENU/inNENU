import { $Page } from "@mptool/all";

import { copyContent, showModal } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "website";
const PAGE_TITLE = "东师网站";

interface WebsiteConfig {
  name: string;
  website: { name: string; desc: string; link: string }[];
}

$Page(PAGE_ID, {
  data: {
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

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

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
    copyContent(currentTarget.dataset.link).then(() => {
      showModal(
        "功能受限",
        "受到小程序限制，无法直接打开网页，网址已复制到剪切板",
      );
    });
  },
});

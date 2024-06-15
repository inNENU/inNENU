import { $Page } from "@mptool/all";

import { copyContent, showModal } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { info } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "website";
const PAGE_TITLE = "东师网站";

$Page(PAGE_ID, {
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

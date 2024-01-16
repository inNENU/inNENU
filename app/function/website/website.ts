import { $Page } from "@mptool/all";

import { setClipboard, showModal } from "../../api/index.js";
import { appCoverPrefix } from "../../config/index.js";
import { info } from "../../utils/info.js";
import { ensureResource, getResource } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const PAGE_ID = "website";
const PAGE_TITLE = "东师网站";

$Page(PAGE_ID, {
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
        height: info.windowHeight - info.statusBarHeight - 160,
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
    setClipboard(currentTarget.dataset.link).then(() => {
      showModal(
        "功能受限",
        "受到小程序限制，无法直接打开网页，网址已复制到剪切板",
      );
    });
  },
});

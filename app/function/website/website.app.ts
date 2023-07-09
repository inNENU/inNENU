import { $Page } from "@mptool/enhance";

import { type AppOption } from "../../app.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "website";

$Page("website", {
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
    this.$go(`web?url=${currentTarget.dataset.link}`);
  },
});

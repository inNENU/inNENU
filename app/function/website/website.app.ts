import { $Page } from "@mptool/enhance";

import { type AppOption } from "../../app.js";
import { getWindowInfo } from "../../utils/api.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

$Page("website", {
  data: {
    config: <unknown[]>[],
  },

  onNavigate() {
    ensureJSON("function/website/index");
  },

  onLoad() {
    getJSON<unknown[]>("function/website/index").then((config) => {
      const info = getWindowInfo();

      this.setData({
        config,
        height: info.windowHeight - info.statusBarHeight - 160,
      });
    });

    popNotice("account");
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
import { $Page } from "@mptool/all";

import { setClipboard, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { ensureResource, getResource } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

interface PhoneItemConfig {
  name: string;
  num: number | string;
  locate?: "benbu" | "jingyue";
}

interface PhoneConfig {
  name: string;
  list: PhoneItemConfig[];
}

const { globalData } = getApp<AppOption>();

$Page("phone", {
  data: {
    config: <PhoneConfig[]>[],
    showInfo: false,
    info: <PhoneItemConfig>{},
  },

  onNavigate() {
    ensureResource("function/phone/index");
  },

  onLoad() {
    getResource<PhoneConfig[]>("function/phone/index").then((config) => {
      this.setData({
        config,
        height:
          globalData.info.windowHeight - globalData.info.statusBarHeight - 160,
      });
    });

    popNotice("phone");
  },

  onShareAppMessage: () => ({
    title: "师大黄页",
    path: `/function/phone/phone`,
  }),

  onShareTimeline: () => ({ title: "师大黄页" }),

  onAddToFavorites: () => ({
    title: "师大黄页",
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - globalData.info.statusBarHeight - 160,
    });
  },

  getConfig({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { group: number; index: number }
  >): PhoneItemConfig {
    const { group, index } = currentTarget.dataset;

    return this.data.config[group].list[index];
  },

  getNumber(config: PhoneItemConfig): string {
    const num = config.num.toString();

    return num.length === 8 ? `0431-${num}` : num;
  },

  call(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { group: number; index: number }
    >,
  ) {
    wx.makePhoneCall({
      phoneNumber: this.getNumber(this.getConfig(event)),
    });
  },

  copyContact(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { group: number; index: number }
    >,
  ) {
    const item = this.getConfig(event);

    setClipboard(this.getNumber(item)).then(() => {
      showToast("号码已复制");
    });
  },

  openInfo(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { group: number; index: number }
    >,
  ): void {
    this.setData({ info: this.getConfig(event), showInfo: true });
  },

  closeInfo(): void {
    this.setData({ showInfo: false });
  },
});

import { $Page } from "@mptool/all";

import { setClipboard, showToast } from "../../api/index.js";
import { appCoverPrefix } from "../../config/index.js";
import { info } from "../../state/index.js";
import { ensureResource, getResource, popNotice } from "../../utils/index.js";

interface PhoneItemConfig {
  name: string;
  num: number | string;
  locate?: "benbu" | "jingyue";
}

interface PhoneConfig {
  name: string;
  list: PhoneItemConfig[];
}

$Page("phone", {
  data: {
    config: [] as PhoneConfig[],
    showInfo: false,
    info: {} as PhoneItemConfig,
  },

  onNavigate() {
    ensureResource("function/phone/index");
  },

  onLoad() {
    getResource<PhoneConfig[]>("function/phone/index").then((config) => {
      this.setData({
        config,
        height: info.windowHeight - info.statusBarHeight - 160,
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
      height: size.windowHeight - info.statusBarHeight - 160,
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

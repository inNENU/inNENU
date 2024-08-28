import { $Page } from "@mptool/all";

import { copyContent, showToast } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { windowInfo } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

interface PhoneItemConfig {
  name: string;
  num: number | string;
  locate?: "benbu" | "jingyue";
}

interface PhoneConfig {
  name: string;
  list: PhoneItemConfig[];
}

const PAGE_TITLE = "师大黄页";
const PAGE_ID = "phone";

$Page("phone", {
  data: {
    title: PAGE_TITLE,
    config: [] as PhoneConfig[],
    showInfo: false,
    info: {} as PhoneItemConfig,
  },

  onNavigate() {
    ensureJson("function/phone/index");
  },

  onLoad() {
    getJson<PhoneConfig[]>("function/phone/index").then((config) => {
      this.setData({
        config,
        height: windowInfo.windowHeight - windowInfo.statusBarHeight - 160,
      });
    });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: "师大黄页",
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - windowInfo.statusBarHeight - 160,
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

    copyContent(this.getNumber(item)).then(() => {
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

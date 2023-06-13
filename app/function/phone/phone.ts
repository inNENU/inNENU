import { $Page } from "@mptool/enhance";

import { addPhoneContact, getWindowInfo } from "../../utils/api.js";
import { appCoverPrefix } from "../../utils/config.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
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

$Page("phone", {
  data: {
    config: <PhoneConfig[]>[],
    showInfo: false,
    info: <PhoneItemConfig>{},
  },

  onNavigate() {
    ensureJSON("function/phone/index");
  },

  onLoad() {
    getJSON<PhoneConfig[]>("function/phone/index").then((config) => {
      const info = getWindowInfo();

      this.setData({
        config,
        height: info.windowHeight - info.statusBarHeight - 160,
      });
    });

    popNotice("account");
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
    const info = getWindowInfo();

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
    >
  ) {
    wx.makePhoneCall({
      phoneNumber: this.getNumber(this.getConfig(event)),
    });
  },

  addContact(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { group: number; index: number }
    >
  ) {
    const item = this.getConfig(event);

    addPhoneContact({
      // 添加联系人
      firstName: item.name,
      hostNumber: this.getNumber(item),
      organization: "东北师范大学",
      ...(item.locate === "benbu"
        ? {
            addressPostalCode: "130024",
            addressStreet: "吉林省长春市人民大街 5268 号",
          }
        : item.locate === "jingyue"
        ? {
            addressPostalCode: "130117",
            addressStreet: "吉林省长春市净月大街 2555 号",
          }
        : {}),
    });
  },

  openInfo(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { group: number; index: number }
    >
  ): void {
    this.setData({ info: this.getConfig(event), showInfo: true });
  },

  closeInfo(): void {
    this.setData({ showInfo: false });
  },
});

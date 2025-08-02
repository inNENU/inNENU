import { $Page, addContact } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { info, windowInfo } from "../../../../state/index.js";
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

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,
    theme: info.theme,
    config: [] as PhoneConfig[],
    showInfo: false,
    info: {} as PhoneItemConfig,
  },

  onNavigate() {
    ensureJson("function/phone/index");
  },

  onLoad() {
    this.setData({
      theme: info.theme,
      height: windowInfo.windowHeight - windowInfo.statusBarHeight - 160,
    });

    getJson<PhoneConfig[]>("function/phone/index").then((config) => {
      this.setData({ config });
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

  addContact(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { group: number; index: number }
    >,
  ) {
    const item = this.getConfig(event);

    addContact({
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
    >,
  ): void {
    this.setData({ info: this.getConfig(event), showInfo: true });
  },

  closeInfo(): void {
    this.setData({ showInfo: false });
  },
});

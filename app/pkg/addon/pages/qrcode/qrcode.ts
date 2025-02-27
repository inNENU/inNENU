import { $Page } from "@mptool/all";

import { assets } from "../../../../config/index.js";
import { windowInfo } from "../../../../state/index.js";

$Page("qrcode", {
  data: {
    statusBarHeight: windowInfo.statusBarHeight,
  },
  onLoad({ type }) {
    this.setData(this.getInfo(type));
  },

  getInfo(type?: string) {
    switch (type) {
      default:
        return {
          header: "关注公众号",
          title: "添加 inNENU 公众号",
          subHeader: "获取小程序动态",
          desc: "扫码关注公众号，关注开发者通知",
          qrcode: `${assets}img/qrcode/official.jpg`,
          bg: `${assets}img/qrcode/wechat.svg`,
          avatar: `${assets}img/inNENU.png`,
          tags: ["公众号", "运行动态", "开发者吐槽"],
          hint: "长按二维码关注",
        };
    }
  },
});

import { $Page } from "@mptool/all";

import type { PageDataWithContent } from "../../../typings/index.js";
import type { AppOption } from "../../app.js";
import { info } from "../../state/info.js";
import { getPrivacyStatus } from "../../utils/agreement.js";
import { popNotice, resolvePage, setPage } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

$Page("privacy", {
  data: {
    theme: info.theme,
    darkmode: info.darkmode,
    page: <PageDataWithContent>{
      title: "隐私说明",
      content: [
        {
          tag: "list",
          header: "隐私声明",
          items: [
            {
              text: "查看详情",
              url: "license",
            },
            { text: "已同意当前隐私协议", desc: "否" },
          ],
        },
        {
          tag: "list",
          header: "授权状态",
          items: [
            { text: "地理位置", desc: "未授权×" },
            { text: "相册", desc: "未授权×" },
          ],
        },
        {
          tag: "functional-list",
          header: "修改授权",
          items: [
            { text: "打开设置页", type: "button", handler: "openSetting" },
          ],
          footer: " ",
        },
      ],
    },

    authorize: {},
  },

  onNavigate(res) {
    resolvePage(res, this.data.page);
  },

  onLoad(option) {
    if (globalData.page.id === "授权设置") setPage({ option, ctx: this });
    else setPage({ option: { id: "authorize" }, ctx: this });

    popNotice("privacy");
  },

  onShow() {
    getPrivacyStatus().then(({ needAuthorize }) => {
      this.setData({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "page.content[0].items[1].desc": needAuthorize ? "否" : "是",
      });
    });
  },

  onReady() {
    // update authorize status
    const { locationAuthorized, albumAuthorized } = wx.getAppAuthorizeSetting();

    this.setData({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "page.content[1].items[0].desc": locationAuthorized
        ? "已授权✓"
        : "未授权×",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "page.content[1].items[1].desc": albumAuthorized ? "已授权✓" : "未授权×",
    });

    popNotice("privacy");
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  openSetting() {
    wx.openAppAuthorizeSetting();
  },
});

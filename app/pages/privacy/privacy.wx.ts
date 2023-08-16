import { $Page } from "@mptool/all";

import type {
  ButtonListComponentItemConfig,
  ListComponentConfig,
  PageDataWithContent,
} from "../../../typings/index.js";
import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { getPrivacyStatus } from "../../utils/agreement.js";
import { popNotice, resolvePage, setPage } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

type AuthorizeList =
  | "scope.userLocation"
  | "scope.writePhotosAlbum"
  | "scope.address"
  | "scope.invoiceTitle"
  | "scope.invoice"
  | "scope.werun"
  | "scope.record"
  | "scope.camera"
  | "scope.addPhoneContact";

const authorizeList: AuthorizeList[] = [
  "scope.userLocation",
  "scope.writePhotosAlbum",
  "scope.addPhoneContact",
  // "scope.address",
  // "scope.invoiceTitle",
  // "scope.invoice",
  // "scope.werun",
  // "scope.record",
  // "scope.camera",
];

$Page("privacy", {
  data: {
    theme: globalData.theme,
    darkmode: globalData.darkmode,
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
            { text: "保存到相册", desc: "未授权×" },
            {
              text: "添加电话到通讯录",
              desc: "未授权×",
              hidden: new Date().getTime() < 1645459200000,
            },
            // { text: "用户信息", desc: "未授权×" },
            // { text: "通讯地址", desc: "未授权×" },
            // { text: "发票抬头", desc: "未授权×" },
            // { text: "获取发票", desc: "未授权×" },
            // { text: "微信运动步数", desc: "未授权×" },
            // { text: "录音", desc: "未授权×" },
            // { text: "摄像头", desc: "未授权×" },
          ],
        },
        {
          tag: "functional-list",
          header: "进行授权",
          items: [
            { text: "地理位置", type: "button", handler: "location" },
            { text: "保存到相册", type: "button", handler: "album" },
            {
              text: "添加到通讯录",
              type: "button",
              handler: "contact",
              hidden: new Date().getTime() < 1645459200000,
            },
            // { text: "用户信息", type: "button", openType: "getUserInfo" },
            // { text: "通讯地址", type: "button", handler: "address" },
            // { text: "发票抬头", type: "button", handler: "invoiceTitle" },
            // { text: "获取发票", type: "button", handler: "invoice" },
            // { text: "微信运动步数", type: "button", handler: "werun" },
            // { text: "录音", type: "button", handler: "record" },
            // { text: "摄像头", type: "button", handler: "camera" },
          ],
          footer: " ",
        },
        {
          tag: "functional-list",
          header: "取消授权",
          items: [
            { text: "取消授权请进入设置页。" },
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
    const { items } = this.data.page.content[1] as ListComponentConfig;

    // update authorize status
    wx.getSetting({
      success: ({ authSetting }) => {
        authorizeList.forEach((type, index) => {
          if (authSetting[type]) items[index].desc = "已授权✓";
        });

        this.setData({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "page.content[1].items": items,
        });
      },
    });

    popNotice("privacy");
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  /** 定位授权 */
  location() {
    this.authorize(0);
  },

  /** 相册授权 */
  album() {
    this.authorize(1);
  },

  /** 通讯录授权 */
  contact() {
    this.authorize(2);
  },

  // /** 通讯地址授权 */
  // address() {
  //   this.authorize(2);
  // },

  // /** 发票抬头授权 */
  // invoiceTitle() {
  //   this.authorize(3);
  // },

  // /** 发票授权 */
  // invoice() {
  //   this.authorize(4);
  // },

  // /** 微信运动数据授权 */
  // werun() {
  //   this.authorize(5);
  // },

  // /** 录音授权 */
  // record() {
  //   this.authorize(6);
  // },

  // /** 摄像头授权 */
  // camera() {
  //   this.authorize(7);
  // },

  /** 授权函数 */
  authorize(type: number) {
    wx.showLoading({ title: "授权中" });

    wx.authorize({
      scope: authorizeList[type],
      success: () => {
        wx.hideLoading();
        showToast("授权成功");
        this.setData({ [`page.content[1].items[${type}].desc`]: "已授权✓" });
      },
      fail: () => {
        // 用户拒绝权限，提示用户开启权限
        wx.hideLoading();
        showModal(
          "权限被拒",
          "您拒绝了权限授予，请在小程序设置页允许权限",
          () => {
            wx.openSetting({
              success: ({ authSetting }) => {
                if (authSetting[authorizeList[type]]) showToast("授权成功");
                else showToast("授权失败，您没有授权");

                wx.getSetting({
                  success: ({ authSetting }) => {
                    const { items } = this.data.page
                      .content[1] as ListComponentConfig;

                    authorizeList.forEach((type2, index) => {
                      (items as ButtonListComponentItemConfig[])[index].desc =
                        authSetting[type2] ? "已授权✓" : "未授权×";
                    });

                    this.setData({
                      // eslint-disable-next-line @typescript-eslint/naming-convention
                      "page.content[1].items": items,
                    });
                  },
                });
              },
            });
          },
        );
      },
    });
  },

  openSetting() {
    wx.openSetting({
      success: () => {
        wx.getSetting({
          success: ({ authSetting }) => {
            const { items } = this.data.page.content[1] as ListComponentConfig;

            authorizeList.forEach((type2, index) => {
              (items as ButtonListComponentItemConfig[])[index].desc =
                authSetting[type2] ? "已授权✓" : "未授权×";
            });

            this.setData({
              // eslint-disable-next-line @typescript-eslint/naming-convention
              "page.content[1].items": items,
            });
          },
        });
      },
    });
  },
});

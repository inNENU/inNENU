import { $Page } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { type AppOption } from "../../app.js";
import { validateAccount } from "../../utils/account.js";
import { modal, tip } from "../../utils/api.js";
import { type AccountInfo } from "../../utils/app.js";
import { appCoverPrefix } from "../../utils/config.js";
import { MONTH } from "../../utils/constant.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "account";
const PAGE_TITLE = "账号信息";

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    /** 导航栏 */
    nav: {
      title: "账号信息",
      statusBarHeight: globalData.info.statusBarHeight,
      from: "功能大厅",
    },

    content: [
      {
        tag: "title",
        text: "账号信息",
      },
    ],

    id: "",
    password: "",
    email: "",

    showPassword: false,
  },

  state: {
    shouldNavigateBack: false,
  },

  onLoad({ update }) {
    const accountInfo = get<AccountInfo>("account-info") || null;

    if (accountInfo)
      this.setData({
        id: accountInfo.id.toString(),
        email: accountInfo.email,
        password: accountInfo.password,
      });
    if (update) this.state.shouldNavigateBack = true;
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/settings/about/about",
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  /** 输入成绩 */
  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    const { id } = currentTarget;
    const { value } = detail;

    this.setData({ [id]: value });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  login() {
    const { email, id, password } = this.data;

    if (!id || !password || !email) {
      wx.showToast({
        title: "请输入完整信息",
        icon: "error",
      });

      return;
    }

    wx.showLoading({ title: "验证中..." });

    validateAccount({ id: Number(id), email, password })
      .then((success) => {
        wx.hideLoading();
        if (success) {
          set("account-info", { id: Number(id), email, password }, MONTH);
          if (this.state.shouldNavigateBack) this.$back();
        } else {
          modal("账号或密码错误", "账号密码错误，请重试。");
        }
      })
      .catch(() => {
        wx.hideLoading();
        tip("验证失败");
      });
  },
});

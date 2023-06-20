import { $Page } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { type AppOption } from "../../app.js";
import { validateAccount } from "../../utils/account.js";
import { modal, tip } from "../../utils/api.js";
import { type AccountInfo } from "../../utils/app.js";
import { MONTH } from "../../utils/constant.js";

const { globalData } = getApp<AppOption>();

$Page("account", {
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

    id: 0,
    password: "",
    email: "",

    showPassword: false,
  },

  state: {
    shouldNavigateBack: false,
  },

  onLoad({ update }) {
    const accountInfo = get<AccountInfo>("account-info") || null;

    if (accountInfo) this.setData(accountInfo);
    if (update) this.state.shouldNavigateBack = true;
  },

  /** 输入成绩 */
  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    const { id } = currentTarget;
    const { value } = detail;

    this.setData({ [id]: id === "id" ? Number(value) : value });
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

    validateAccount({ id, email, password })
      .then((success) => {
        wx.hideLoading();
        if (success) {
          set("account-info", { id, email, password }, MONTH);
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

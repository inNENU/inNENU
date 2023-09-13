import { $Page, set } from "@mptool/all";

import { authInit, getAuthInit } from "./api.js";
import type {
  ListComponentConfig,
  ListComponentItemConfig,
} from "../../../typings/components.js";
import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import {
  ACCOUNT_INFO_KEY,
  USER_INFO_KEY,
  appCoverPrefix,
  assets,
} from "../../config/index.js";
import { LoginFailType, logout } from "../../login/index.js";
import { getLicenseStatus } from "../../utils/agreement.js";
import { MONTH } from "../../utils/constant.js";
import { popNotice } from "../../utils/page.js";
import type { UserInfo } from "../../utils/typings.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "account";
const PAGE_TITLE = "统一身份认证信息";

const EMPTY_CONTENT = [{ text: "暂无个人信息" }];

const FOOTER = `
『登录说明』
小程序需自动完成登录以提供基于账户的功能。您可能需要在以下情况时进行额外操作:
1. 小程序的不同功能可能基于不同系统，需要同时保持多处登录。为正常使用小程序您必须关闭「单处登录」功能，如您已开启请前往统一身份认证官网关闭。
2. 账户登录失败次数过多或异地登录时将无法自动登录，此时你需要重新登录并填写验证码。

『隐私说明』
Mr.Hope 会严格遵守隐私协议的要求，您的账号、密码与个人信息将仅存储在本地，并在卸载 App 或小程序时一并删除。Mr.Hope 不会收集并存储您的任何信息。
`;

const getDisplay = ({
  name,
  grade,
  id,
  org = "未知",
  major = "未知",
}: UserInfo): ListComponentItemConfig[] => [
  {
    text: "姓名",
    desc: name,
  },
  {
    text: "学号",
    desc: id.toString(),
  },
  {
    text: "年级",
    desc: grade.toString(),
  },
  {
    text: "学院",
    desc: org,
  },
  {
    text: "专业",
    desc: major,
  },
];

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,
    logo:
      globalData.env === "qq"
        ? `${assets}img/inNENU.png`
        : "/frameset/placeholder.png",

    /** 导航栏 */
    nav: {
      title: PAGE_TITLE,
      statusBarHeight: globalData.info.statusBarHeight,
      from: "返回",
    },

    list: <ListComponentConfig>{
      header: false,
      items: EMPTY_CONTENT,
    },

    footer: {
      desc: FOOTER,
    },

    id: "",
    password: "",
    captcha: "",
    isSaved: false,
    showPassword: false,
    captchaContent: "",
    accept: false,
  },

  state: {
    shouldNavigateBack: false,
    initOptions: <{ params: Record<string, string>; salt: string }>{},
  },

  onLoad({ from = "返回", update }) {
    const { account, userInfo } = globalData;

    if (account)
      this.setData({
        id: account.id.toString(),
        password: account.password,
        isSaved: true,
      });

    if (userInfo)
      this.setData({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "list.items": getDisplay(userInfo),
      });

    if (update) this.state.shouldNavigateBack = true;

    this.setData({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "nav.from": from,
    });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/pages/account/account",
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    const { id } = currentTarget;
    const { value } = detail;

    this.setData({ [id]: value }, () => {
      if (id === "id" && value.length === 10) this.init();
    });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  async init() {
    const { id } = this.data;

    if (id.length !== 10) return;

    return getAuthInit(id).then((result) => {
      if (!result.success) return showModal("登录失败", result.msg);

      const { captcha, params, salt } = result;

      this.setData({ captchaContent: captcha });
      this.state.initOptions = { params, salt };
    });
  },

  acceptLicense() {
    this.setData({ accept: !this.data.accept });
  },

  async save() {
    const { id, password, captcha, accept } = this.data;

    if (!id || !password) {
      wx.showToast({ title: "请输入完整信息", icon: "error" });

      return;
    }

    if (!accept) {
      wx.showToast({ title: "请同意用户协议", icon: "error" });

      return;
    }

    wx.showLoading({ title: "验证中" });

    // 设置协议版本
    wx.setStorageSync("license", (await getLicenseStatus()).version);

    try {
      const result = await authInit({
        ...this.state.initOptions,
        id: Number(id),
        password,
        captcha,
        openid: globalData.openid,
      });

      wx.hideLoading();

      if (result.success) {
        const account = { id: Number(id), password };

        globalData.account = account;
        set(ACCOUNT_INFO_KEY, account, MONTH);

        if (result.info) {
          showModal("登录成功", "您已成功登录");

          set(USER_INFO_KEY, result.info, MONTH);
          globalData.userInfo = result.info;

          this.setData({
            isSaved: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "list.items": getDisplay(result.info),
          });

          if (this.state.shouldNavigateBack) this.$back();
        } else {
          showModal(
            "登录失败",
            "账号密码校验成功，但未能获取个人信息，部分功能无法使用。",
          );
          this.setData({ isSaved: true });
          if (this.state.shouldNavigateBack) this.$back();
        }
      } else {
        this.init();

        if (result.type === LoginFailType.NeedCaptcha)
          showModal("登录失败", "需要验证码，请输入验证码");
        else showModal("登录失败", result.msg);
      }
    } catch (err) {
      console.error(err);
      wx.hideLoading();
      showToast("验证失败");
    }
  },

  delete() {
    showModal(
      "删除账号",
      "确认删除账号? 这会清除本地的全部个人信息与数据且无法恢复。",
      () => {
        logout();
        showModal("删除成功", "已删除本地账号信息");
      },
      () => {
        // do nothing
      },
    );
  },
});

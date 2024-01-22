import { $Page } from "@mptool/all";

import type {
  ListComponentConfig,
  ListComponentItemConfig,
} from "../../../typings/components.js";
import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, assets } from "../../config/index.js";
import {
  LoginFailType,
  authInitInfo,
  initAuth,
  onlineAuthInitInfo,
  onlineInitAuth,
  supportRedirect,
} from "../../service/index.js";
import { info } from "../../state/info.js";
import type { UserInfo } from "../../state/user.js";
import { setUserInfo, user } from "../../state/user.js";
import { getLicenseStatus } from "../../utils/agreement.js";
import { logout } from "../../utils/logout.js";
import { popNotice } from "../../utils/page.js";

const { useOnlineService } = getApp<AppOption>();
const { envName } = info;

const PAGE_ID = "account";
const PAGE_TITLE = "统一身份认证信息";

const EMPTY_CONTENT = [{ text: "暂无个人信息" }];

const FOOTER = `
『登录说明』
${envName}需自动完成登录以提供基于账户的功能。您可能需要在以下情况时进行额外操作:
1. ${envName}的不同功能可能基于不同系统，需要同时保持多处登录。为正常使用${envName}您必须关闭「单处登录」功能，如您已开启请前往统一身份认证官网关闭。
2. 账户登录失败次数过多或异地登录时将无法自动登录，此时你需要重新登录并填写验证码。

『隐私说明』
Mr.Hope 会严格遵守隐私协议的要求。
${
  supportRedirect
    ? "您的账号、密码与个人信息将仅存储在本地，并会直接通过小程序登录各系统。Mr.Hope 不能收集并存储这些信息。"
    : "您的账号、密码与个人信息将仅存储在本地，使用时将会经小程序服务器转发给学校各服务系统。Mr.Hope 不会在此过程中收集或存储任何信息。"
}
全部个人信息将在卸载${envName}一并删除。
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
    theme: info.theme,
    logo:
      info.env === "qq"
        ? `${assets}img/inNENU.png`
        : "/frameset/placeholder.png",

    /** 导航栏 */
    nav: {
      title: PAGE_TITLE,
      statusBarHeight: info.statusBarHeight,
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
    captchaContent: <string | null>null,
    accept: false,
  },

  state: {
    shouldNavigateBack: false,
    initOptions: <{ params: Record<string, string>; salt: string }>{},
  },

  onLoad({ from = "返回", update }) {
    const { account, info } = user;

    if (account)
      this.setData({
        id: account.id.toString(),
        password: account.password,
        isSaved: true,
      });

    if (info)
      this.setData({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "list.items": getDisplay(info),
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

    return (
      useOnlineService("auth-init-info") ? onlineAuthInitInfo : authInitInfo
    )(id).then((result) => {
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
      const result = await (
        useOnlineService("init-auth") ? onlineInitAuth : initAuth
      )({
        ...this.state.initOptions,
        id: Number(id),
        password,
        captcha,
        openid: user.openid!,
      });

      wx.hideLoading();

      if (result.success) {
        if (result.info) {
          showModal("登录成功", "您已成功登录");

          this.setData({
            isSaved: true,
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "list.items": getDisplay(result.info),
          });

          setUserInfo({ id: Number(id), password }, result.info);

          if (this.state.shouldNavigateBack) this.$back();
        } else {
          showModal("登录失败", "账号密码校验成功，但个人信息获取失败。");
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
        this.setData({
          id: "",
          password: "",
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "list.items": EMPTY_CONTENT,
          isSaved: false,
        });
        showModal("删除成功", "已删除本地账号信息");
      },
      () => {
        // do nothing
      },
    );
  },
});

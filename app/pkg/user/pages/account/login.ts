import { $Page } from "@mptool/all";

import type { ListComponentConfig } from "../../../../../typings/components.js";
import { retryAction, showModal, showToast } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { ActionFailType, supportRedirect } from "../../../../service/index.js";
import type { UserInfo } from "../../../../state/index.js";
import {
  envName,
  info,
  logo,
  setUserInfo,
  user,
} from "../../../../state/index.js";
import {
  getLicenseStatus,
  logout,
  showNotice,
} from "../../../../utils/index.js";
import type { AuthCaptchaInfo } from "../../service/index.js";
import {
  authInit,
  getAuthCaptcha,
  getAuthInitInfo,
  sendReAuthSMS,
  verifyAuthCaptcha,
  verifyReAuthCaptcha,
} from "../../service/index.js";

const PAGE_ID = "account-login";
const PAGE_TITLE = "统一身份认证信息";

const EMPTY_CONTENT = [{ text: "暂无个人信息" }];

const FOOTER = `
『登录说明』
${envName}需自动完成登录以提供基于账户的功能。您可能需要在以下情况时进行额外操作:
1. ${envName}的不同功能可能基于不同系统，需要同时保持多处登录。为正常使用${envName}您必须关闭「单处登录」功能，如您已开启请前往统一身份认证官网关闭。
2. 账户登录失败次数过多或异地登录时将无法自动登录，此时您需要重新登录并填写验证码。

『隐私说明』
Mr.Hope 会严格遵守隐私协议的要求。
${
  supportRedirect
    ? "您的账号、密码与个人信息将仅存储在本地，并会直接通过小程序登录各系统。Mr.Hope 不能收集并存储这些信息。"
    : "您的账号、密码与个人信息将仅存储在本地，使用时将会经小程序服务器转发给学校各服务系统。Mr.Hope 不会在此过程中收集或存储任何信息。"
}
全部个人信息将在卸载${envName}一并删除。
`;

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    logo,

    /** 导航栏 */
    nav: {
      title: PAGE_TITLE,
      statusBarHeight: info.statusBarHeight,
      from: "返回",
    },

    list: {
      header: false,
      items: EMPTY_CONTENT,
    } as ListComponentConfig,

    footer: {
      desc: FOOTER,
    },

    id: "",
    password: "",

    distance: 0,
    sliderWidth: 45,

    smsCode: "",

    info: null as UserInfo | null,

    isSaved: false,
    showPassword: false,
    showReAuth: false,
    accept: false,
  },

  state: {
    authToken: "",
    shouldNavigateBack: false,
    initOptions: {} as { params: Record<string, string>; salt: string },
    touchPosition: 0,
  },

  onLoad({ from = "返回", update }) {
    const { account, info } = user;

    if (account)
      this.setData({
        id: account.id.toString(),
        password: account.password,
        isSaved: true,
      });

    if (info) this.setData({ info });
    if (update) this.state.shouldNavigateBack = true;

    this.setData({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "nav.from": from,
    });
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
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
      if (id === "id" && value.length === 10) this.getInitInfo();
    });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onSliderMove({ currentTarget, type, touches }: WechatMiniprogram.Touch) {
    switch (type) {
      case "touchstart":
        this.state.touchPosition = touches[0].pageX - currentTarget.offsetLeft;
        break;
      case "touchmove": {
        const distance = touches[0].pageX - this.state.touchPosition;

        this.setData({
          distance: Math.max(
            0,
            Math.min(distance, 295 - this.data.sliderWidth / 2),
          ),
        });
        break;
      }
      case "touchend": {
        // reset state
        this.state.touchPosition = 0;
        // verify captcha
        this.verifyCaptcha();
      }
    }
  },

  setCaptchaInfo({ slider, bg, sliderWidth, offsetY }: AuthCaptchaInfo) {
    this.setData({
      captchaBg: bg,
      captchaSlider: slider,
      sliderOffsetY: offsetY,
      sliderWidth,
    });
  },

  async getInitInfo() {
    const { id } = this.data;

    if (id.length !== 10) return;

    const result = await getAuthInitInfo(id);

    if (!result.success) return showModal("登录失败", result.msg);

    const { params, salt, needCaptcha, captcha } = result;

    this.state.initOptions = { params, salt };

    if (needCaptcha) {
      if (!captcha.success)
        return retryAction("获取账号信息失败", "未成功获取验证码", () => {
          this.getAuthCaptcha();
        });

      return this.setCaptchaInfo(captcha.data);
    }
  },

  async getAuthCaptcha() {
    const result = await getAuthCaptcha(this.data.id);

    if (!result.success)
      return showModal("获取失败", "拼图验证码获取失败", () => {
        this.getAuthCaptcha();
      });

    return this.setCaptchaInfo(result.data);
  },

  async verifyCaptcha() {
    const result = await verifyAuthCaptcha(this.data.distance);

    // clear captcha
    this.setData({ captchaBg: "", distance: 0 });

    if (!result.success) {
      retryAction("验证失败", "请正确拼合图像。", () => {
        this.getAuthCaptcha();
      });
    }

    return showModal("验证成功", "请继续登录");
  },

  acceptLicense() {
    this.setData({ accept: !this.data.accept });
  },

  async save() {
    const { id, password, accept } = this.data;
    const { authToken } = this.state;

    if (!id || !password)
      return wx.showToast({ title: "请输入完整信息", icon: "error" });

    if (!accept)
      return wx.showToast({ title: "请同意用户协议", icon: "error" });

    wx.showLoading({ title: "验证中" });

    // 设置协议版本
    wx.setStorageSync("license", (await getLicenseStatus()).version);

    const result = await authInit({
      ...this.state.initOptions,
      id: Number(id),
      password,
      authToken,
      openid: user.openid!,
    });

    wx.hideLoading();

    if (result.success) {
      if (!result.info)
        return showModal(
          "登录失败",
          "账号密码校验成功，但未能成功获取账号信息。",
        );

      showModal("登录成功", "您已成功登录");

      setUserInfo({ id: Number(id), password, authToken }, result.info);

      if (this.state.shouldNavigateBack) return this.$back();

      return this.setData({
        isSaved: true,
        info: result.info,
      });
    }

    if (result.type === ActionFailType.NeedReAuth) return this.startReAuth();

    showModal("登录失败", result.msg);

    return this.getInitInfo();
  },

  async startReAuth() {
    const result = await sendReAuthSMS(this.data.id);

    if (result.success) {
      showModal("需要二次验证", "短信验证码已发送，请注意查收。");

      return this.setData({
        showReAuth: true,
        hiddenCellphone: result.data.hiddenCellphone,
      });
    }

    if (result.type === ActionFailType.TooFrequent) {
      showModal(
        "已发送验证码",
        `两分钟内已下发过短信验证码，重新发送需等待 ${result.codeTime} 秒。`,
      );

      return this.setData({ showReAuth: true });
    }

    return showModal("发送失败", result.msg);
  },

  async verifyReAuth() {
    const { smsCode } = this.data;

    if (!smsCode) return showToast("请输入验证码");

    const result = await verifyReAuthCaptcha(smsCode);

    this.setData({ smsCode: "" });

    if (!result.success) {
      return showModal("验证失败", result.msg);
    }

    this.setData({ showReAuth: false });
    this.state.authToken = result.authToken;

    return this.save();
  },

  cancelReAuth() {
    this.setData({ showReAuth: false, smsCode: "" });
  },

  reset() {
    showModal("忘记密码", "请前往官网 authserver.nenu.edu.cn 按引导操作。");
  },

  delete() {
    showModal(
      "退出登录",
      "确认退出登录? 这会清除本地的全部个人信息与数据且无法恢复。",
      () => {
        logout();
        this.setData({
          id: "",
          password: "",
          info: null,
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

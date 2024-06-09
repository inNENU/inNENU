import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { SECOND, appCoverPrefix, assets } from "../../config/index.js";
import type {
  ResetPasswordInfoResponse,
  ResetPasswordSendSMSResponse,
  ResetPasswordVerifySMSResponse,
} from "../../service/index.js";
import {
  getCaptcha,
  resetPasswordOnline,
  sendSMS,
  setNewPassword,
  supportRedirect,
  verifyAccount,
  verifySMS,
} from "../../service/index.js";
import { info } from "../../state/info.js";
import { getColor, popNotice } from "../../utils/page.js";

const { useOnlineService } = getApp<AppOption>();
const { envName } = info;

const PAGE_ID = "reset";
const PAGE_TITLE = "重置统一身份认证密码";
const RESET_KEY = "reset-sms-code";

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

    footer: {
      desc: `\
『重置说明』
${envName}严格使用官方密码重置服务流程。
您所填写的信息会直接发送给官方服务器${
        supportRedirect ? "" : "，Mr.Hope 不会收集并存储您的任何信息"
      }。\
`,
    },

    stage: "info" as "info" | "phone" | "password" | "success",

    id: "",
    mobile: "",
    captcha: "",

    code: "",

    password: "",
    showPassword: false,
    confirmPassword: "",
    showConfirmPassword: false,
  },

  state: {
    sign: "",
    salt: "",
  },

  onLoad() {
    this.getCaptcha();

    this.setData({
      color: getColor(),
    });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/reset/reset",
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    const { id } = currentTarget;
    const { value } = detail;

    this.setData({ [id]: value });
  },

  getCaptcha() {
    return (
      useOnlineService(PAGE_ID) ? resetPasswordOnline("GET") : getCaptcha()
    ).then(({ captcha }) => {
      this.setData({ image: captcha });
    });
  },

  async verify() {
    const { id, mobile, captcha } = this.data;

    if (!id) return showModal("信息缺失", "请输入学号");
    if (id.length !== 10) return showModal("信息错误", "学号应为 10 位数字");
    if (!/1\d{10}/.test(mobile))
      return showModal("信息错误", "请输入正确的手机号");
    if (!captcha) return showModal("信息缺失", "请输入验证码");

    wx.showLoading({ title: "正在验证" });

    const data = await (useOnlineService(PAGE_ID)
      ? (resetPasswordOnline({
          id,
          mobile,
          captcha,
        }) as Promise<ResetPasswordInfoResponse>)
      : verifyAccount({ id, mobile, captcha }));

    wx.hideLoading();

    if (data.success) {
      this.state.sign = data.sign;
      this.sendSMS();

      return this.setData({ stage: "phone" });
    }

    showModal("信息有误", data.msg);

    return this.getCaptcha();
  },

  async sendSMS() {
    if (get(RESET_KEY)) return showToast("请勿频繁发送", 1000, "none");

    const { id, mobile } = this.data;
    const { sign } = this.state;

    wx.showLoading({ title: "发送中" });

    const data = await (useOnlineService(PAGE_ID)
      ? (resetPasswordOnline({
          id,
          mobile,
          sign,
        }) as Promise<ResetPasswordSendSMSResponse>)
      : sendSMS({ id, mobile, sign }));

    wx.hideLoading();

    if (data.success) {
      this.state.sign = data.sign;
      showToast("发送成功", 1000, "success");
      set(RESET_KEY, true, SECOND * 100);
    } else showModal("验证码发送失败", data.msg);
  },

  async verifySMS() {
    const { id, mobile, code } = this.data;
    const { sign } = this.state;

    wx.showLoading({ title: "验证中" });

    const data = await (useOnlineService(PAGE_ID)
      ? (resetPasswordOnline({
          id,
          mobile,
          sign,
          code,
        }) as Promise<ResetPasswordVerifySMSResponse>)
      : verifySMS({ id, mobile, sign, code }));

    wx.hideLoading();

    if (data.success) {
      showToast("验证成功", 1000, "success");
      this.state.sign = data.sign;
      this.state.salt = data.salt;

      return this.setData({ stage: "password" });
    }

    showModal("验证码错误", data.msg);
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  toggleConfirmPassword() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword });
  },

  async setPassword() {
    const { id, mobile, code, password, confirmPassword } = this.data;
    const { salt, sign } = this.state;

    if (!password) return showModal("密码缺失", "请输入拟设定的密码");

    if (password !== confirmPassword)
      return showModal("密码不一致", "请确认两次输入的密码一致");

    if (password.length < 8)
      return showModal("密码格式不合法", "密码至少为 8 位");

    if (
      [
        /[A-Z]/.test(password),
        /[a-z]/.test(password),
        /[0-9]/.test(password),
        /[!~`@#$%^&*()_+-=[\]{}\\|;':",./?<>]/.test(password),
      ].filter(Boolean).length < 3
    )
      return showModal(
        "密码格式不合法",
        "密码至少包含大写字母、小写字母、数字和特殊字符中的三种",
      );

    wx.showLoading({ title: "重置密码" });

    const data = await (useOnlineService(PAGE_ID)
      ? (resetPasswordOnline({
          id,
          mobile,
          sign,
          code,
          password,
          salt,
        }) as Promise<ResetPasswordVerifySMSResponse>)
      : setNewPassword({ id, mobile, sign, code, password, salt }));

    wx.hideLoading();

    if (data.success) {
      showToast("设置成功", 1000, "success");

      return this.setData({ stage: "success" });
    }

    showModal("重置密码失败", data.msg);
  },
});

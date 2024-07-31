import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../../../api/index.js";
import { MINUTE, appCoverPrefix } from "../../../../config/index.js";
import { ActionFailType, supportRedirect } from "../../../../service/index.js";
import { envName, info, logo, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type {} from "../../service/index.js";
import { activateAccount } from "../../service/index.js";

const ACTIVATE_SMS_KEY = "activate-sms-code";
const PAGE_ID = "account-activate";
const PAGE_TITLE = "账号激活";

const ID_TYPES = [
  "身份证",
  "护照",
  "港澳居民来往内地通行证",
  "旅行证据",
  "其他",
] as const;

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

    footer: {
      desc: `\
『激活说明』
${envName}严格使用官方激活流程。
您所填写的信息会${
        supportRedirect ? "直接发送" : `经${envName}转发`
      }给官方服务器${
        supportRedirect ? "" : "，Mr.Hope 不会收集并存储您的任何信息"
      }。\
`,
    },

    status: "loading" as "loading" | "success" | "error",
    stage: "license" as "license" | "info" | "phone" | "password" | "success",

    accept: false,

    name: "",
    schoolId: "",
    idTypes: ID_TYPES,
    idTypeIndex: "0",
    id: "",
    captcha: "",

    mobile: "",
    smsCode: "",

    password: "",
    showPassword: false,
    confirmPassword: "",
    showConfirmPassword: false,
  },

  state: {
    sign: "",
    captchaId: "",
  },

  onLoad() {
    if (user.account)
      showModal("无需激活", "当前已登录统一身份认证账户", () => {
        this.$back();
      });
    else this.init();

    this.setData({ color: getPageColor() });
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

    this.setData({ [id]: value });
  },

  async init() {
    wx.showLoading({ title: "加载中" });

    const result = await activateAccount({ type: "get-info" });

    wx.hideLoading();

    if (!result.success) {
      return this.setData({
        status: "error",
        errMsg: result.msg,
      });
    }

    const { license, captcha, captchaId } = result.data;

    this.state.captchaId = captchaId;

    this.setData({ status: "success", captchaImage: captcha, license });
  },

  acceptLicense() {
    this.setData({ accept: !this.data.accept });
  },

  confirmLicense() {
    if (this.data.accept) this.setData({ stage: "info" });
    else showModal("未确认协议", '请先勾选"我已阅读并同意"');
  },

  async verify() {
    const { name, id, idTypeIndex, schoolId, captcha } = this.data;

    if (!name) return showModal("信息缺失", "请输入姓名");
    if (!id) return showModal("信息缺失", "请输入证件号");
    if (!schoolId) return showModal("信息缺失", "请输入学号");
    if (!/\d{10}/.test(schoolId))
      return showModal("信息有误", "学号应为10位数字");
    if (!captcha) return showModal("信息缺失", "请输入验证码");

    wx.showLoading({ title: "正在验证" });

    const result = await activateAccount({
      type: "validate-info",
      name,
      id,
      idType: Number(idTypeIndex),
      schoolId,
      captcha,
      captchaId: this.state.captchaId,
    });

    wx.hideLoading();

    if (result.success) {
      const { captcha, captchaId, sign } = result.data;

      this.state.captchaId = captchaId;
      this.state.sign = sign;

      return this.setData({
        stage: "phone",
        captcha: "",
        captchaImage: captcha,
      });
    }

    if (result.type === ActionFailType.WrongCaptcha) {
      const { captcha, captchaId } = result.data;

      this.setData({ captcha: "", captchaImage: captcha });
      this.state.captchaId = captchaId;

      return showModal("验证码错误", "请重新输入验证码");
    }

    showModal("信息有误", result.msg);

    return this.init();
  },

  async sendSMS() {
    const { mobile, captcha } = this.data;
    const { captchaId, sign } = this.state;

    if (!captcha) return showModal("无法发送", "请先输入验证码");

    if (get(ACTIVATE_SMS_KEY)) return showModal("验证码已发送", "请勿重复发送");

    if (!/1\d{10}/.test(mobile)) {
      showModal("手机号码有误", "请输入正确的手机号");

      return;
    }

    wx.showLoading({ title: "发送中" });

    const result = await activateAccount({
      type: "send-sms",
      mobile,
      sign,
      captcha,
      captchaId,
    });

    wx.hideLoading();

    if (!result.success) {
      if (result.type === ActionFailType.WrongCaptcha) {
        const { captchaId, captcha } = result.data;

        this.setData({ captcha: "", captchaImage: captcha });
        this.state.captchaId = captchaId;

        return showToast("验证码不正确");
      }

      return showModal("验证码发送失败", result.msg);
    }

    showToast("发送成功", 1000, "success");
    set(ACTIVATE_SMS_KEY, true, 2 * MINUTE);
    this.state.sign = result.data.sign;

    return;
  },

  async bindPhone() {
    const { smsCode } = this.data;

    wx.showLoading({ title: "绑定中" });

    const result = await activateAccount({
      type: "validate-sms",
      sign: this.state.sign,
      code: smsCode,
    });

    wx.hideLoading();

    if (!result.success) return showModal("绑定失败", result.msg);

    this.state.sign = result.data.sign;

    this.setData({ stage: "password" });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  toggleConfirmPassword() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword });
  },

  async setPassword() {
    const { password, confirmPassword } = this.data;

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

    wx.showLoading({ title: "设置密码" });

    const checkResult = await activateAccount({
      type: "check-password",
      password,
      sign: this.state.sign,
    });

    if (!checkResult.success) {
      wx.hideLoading();

      return showModal("密码不合规", checkResult.msg);
    }

    const setResult = await activateAccount({
      type: "set-password",
      password,
      sign: this.state.sign,
    });

    wx.hideLoading();

    if (!setResult.success) return showModal("密码设置失败", setResult.msg);

    this.setData({ stage: "success" });
  },
});

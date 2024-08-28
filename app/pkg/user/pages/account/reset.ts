import { $Page } from "@mptool/all";

import { showModal, showToast } from "../../../../api/index.js";
import { appCoverPrefix, logo } from "../../../../config/index.js";
import { ActionFailType, supportRedirect } from "../../../../service/index.js";
import { envName, info, windowInfo } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import { getResetCaptchaLocal, resetPassword } from "../../service/index.js";

const PAGE_ID = "account-reset";
const PAGE_TITLE = "重置统一身份认证密码";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    logo,

    /** 导航栏 */
    nav: {
      title: PAGE_TITLE,
      statusBarHeight: windowInfo.statusBarHeight,
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
    cellphone: "",
    captcha: "",

    code: "",

    password: "",
    showPassword: false,
    confirmPassword: "",
    showConfirmPassword: false,

    captchaImage: "",
    hideCellphone: "",
    hideEmail: "",
  },

  state: {
    oldCaptcha: "",
    oldCaptchaId: "",
    captchaId: "",
    isAppealFlag: "0" as "0" | "1",
    appealSign: "",
    sign: "",
  },

  onLoad() {
    this.init();

    this.setData({
      color: getPageColor(),
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

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    const { id } = currentTarget;
    const { value } = detail;

    this.setData({ [id]: value });
  },

  async getCaptcha() {
    const result = await getResetCaptchaLocal();

    if (!result.success) return showModal("获取验证码失败", result.msg);

    this.state.captchaId = result.data.captchaId;
    this.setData({ captchaImage: result.data.captcha });
  },

  async init() {
    const result = await resetPassword({ type: "init" });

    if (!result.success) return showModal("初始化失败", result.msg);

    this.state.captchaId = result.data.captchaId;
    this.setData({ captchaImage: result.data.captcha });
  },

  async getInfo() {
    const { id, captcha } = this.data;
    const { captchaId } = this.state;

    if (!id) return showModal("信息缺失", "请输入学号");
    if (id.length !== 10) return showModal("信息错误", "学号应为 10 位数字");
    if (!captcha) return showModal("未填写验证码", "请输入验证码");

    wx.showLoading({ title: "获取信息" });

    const result = await resetPassword({
      type: "get-info",
      id,
      captcha,
      captchaId,
    });

    wx.hideLoading();

    if (!result.success) {
      if (result.type === ActionFailType.WrongCaptcha) {
        const { captchaId, captcha } = result.data;

        this.state.captchaId = captchaId;
        showModal("验证码错误", result.msg);

        return this.setData({ captchaImage: captcha });
      }

      showModal("获取信息失败", result.msg);

      return this.getCaptcha();
    }

    const {
      hideCellphone,
      hideEmail,
      captcha: captchaImage,
      ...args
    } = result.data;

    this.state = {
      ...this.state,
      oldCaptcha: captcha,
      oldCaptchaId: captchaId,
      ...args,
    };

    return this.setData({
      stage: "phone",
      captcha: "",
      captchaImage,
      hideCellphone,
      hideEmail,
    });
  },

  async sendCode() {
    const { captcha, id, cellphone, hideCellphone, hideEmail } = this.data;
    const { captchaId, isAppealFlag, appealSign, sign } = this.state;

    if (!/1\d{10}/.test(cellphone))
      return showModal("信息错误", "请输入正确的手机号");

    wx.showLoading({ title: "发送中" });

    const result = await resetPassword({
      type: "send-code",
      id,
      captcha,
      captchaId,
      cellphone,
      email: "",
      hideCellphone,
      hideEmail,
      isAppealFlag,
      appealSign,
      sign,
    });

    wx.hideLoading();

    if (!result.success) {
      if (result.type === ActionFailType.WrongCaptcha) {
        const { captchaId, captcha } = result.data;

        this.state.captchaId = captchaId;
        showModal("验证码错误", result.msg);

        return this.setData({ captchaImage: captcha });
      }

      return showModal("验证码发送失败", result.msg);
    }

    showToast("发送成功", 1000, "success");

    this.state.sign = result.data.sign;
  },

  async verifyCode() {
    const { id, cellphone, hideCellphone, hideEmail, code } = this.data;
    const { oldCaptcha, oldCaptchaId, isAppealFlag, appealSign, sign } =
      this.state;

    if (!code) return showModal("未填写验证码", "请点击发送验证码后输入验证码");

    wx.showLoading({ title: "验证中" });

    const result = await resetPassword({
      type: "validate-code",
      id,
      captcha: oldCaptcha,
      captchaId: oldCaptchaId,
      cellphone,
      email: "",
      hideCellphone,
      hideEmail,
      isAppealFlag,
      appealSign,
      sign,
      code,
    });

    wx.hideLoading();

    if (!result.success) {
      if (result.type === ActionFailType.WrongCaptcha) {
        const { captchaId, captcha } = result.data;

        this.state.captchaId = captchaId;
        showModal("验证码错误", result.msg);

        return this.setData({ captchaImage: captcha });
      }

      return showModal("验证失败", result.msg);
    }

    showToast("验证成功", 1000, "success");

    this.state.sign = result.data.sign;

    return this.setData({ stage: "password", rules: result.data.rules });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  toggleConfirmPassword() {
    this.setData({ showConfirmPassword: !this.data.showConfirmPassword });
  },

  async setPassword() {
    const {
      id,
      cellphone,
      hideCellphone,
      hideEmail,
      code,
      password,
      confirmPassword,
    } = this.data;
    const { oldCaptcha, oldCaptchaId, isAppealFlag, appealSign, sign } =
      this.state;

    if (!password) return showModal("密码缺失", "请输入拟设定的密码");

    if (password !== confirmPassword)
      return showModal("密码不一致", "请确认两次输入的密码一致");

    wx.showLoading({ title: "检查密码" });

    const result = await resetPassword({
      type: "check-password",
      password,
      sign,
    });

    if (!result.success) {
      wx.hideLoading();

      return showModal("密码不符合要求", result.msg);
    }

    wx.showLoading({ title: "设置密码" });

    const data = await resetPassword({
      type: "reset-password",
      id,
      captcha: oldCaptcha,
      captchaId: oldCaptchaId,
      cellphone,
      email: "",
      hideCellphone,
      hideEmail,
      isAppealFlag,
      appealSign,
      sign,
      code,
      password,
    });

    wx.hideLoading();

    if (!data.success) return showModal("重置密码失败", data.msg);

    showToast("设置成功", 1000, "success");

    return this.setData({ stage: "success" });
  },
});

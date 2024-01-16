import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { MINUTE } from "../../config/index.js";
import { appCoverPrefix, assets } from "../../config/info.js";
import type {
  ActivateBindPhoneOptions,
  ActivateBindPhoneResponse,
  ActivateInfoResponse,
  ActivatePasswordOptions,
  ActivatePasswordResponse,
  ActivatePhoneSmsOptions,
  ActivatePhoneSmsResponse,
  ActivateReplacePhoneOptions,
  ActivateReplacePhoneResponse,
} from "../../service/index.js";
import {
  activateAccountOnline,
  bindPhone,
  checkAccount,
  getImage,
  idTypes,
  replacePhone,
  sendSms,
  setPassword,
  supportRedirect,
} from "../../service/index.js";
import { info } from "../../state/info.js";
import { user } from "../../state/user.js";
import { getColor, popNotice } from "../../utils/page.js";

const { useOnlineService } = getApp<AppOption>();
const { envName } = info;

const ACTIVATE_SMS_KEY = "activate-sms-code";
const PAGE_ID = "activate";
const PAGE_TITLE = "账号激活";

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
『激活说明』
${envName}严格使用官方激活流程。
您所填写的信息会${
        supportRedirect ? "直接发送" : `经${envName}转发`
      }给官方服务器${
        supportRedirect ? "" : "，Mr.Hope 不会收集并存储您的任何信息"
      }。\
`,
    },

    stage: <"license" | "info" | "phone" | "password" | "success">"license",

    accept: false,

    name: "",
    schoolID: "",
    idTypes,
    idTypeIndex: 0,
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
    activationId: "",
  },

  onLoad() {
    if (user.account)
      showModal("无需激活", "当前已登录统一身份认证账户", () => {
        this.$back();
      });
    else this.getCaptcha();

    this.setData({ color: getColor() });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/activate/activate",
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

  getCaptcha() {
    return (
      useOnlineService(PAGE_ID) ? activateAccountOnline("GET") : getImage()
    ).then(({ license, image }) => {
      this.setData({ license, image });
    });
  },

  acceptLicense() {
    this.setData({ accept: !this.data.accept });
  },

  confirmLicense() {
    if (this.data.accept) this.setData({ stage: "info" });
    else showModal("未确认协议", '请先勾选"我已阅读并同意"');
  },

  async verify() {
    const { name, id, idTypeIndex, idTypes, schoolID, captcha } = this.data;

    if (!name) return showModal("信息缺失", "请输入姓名");
    if (!id) return showModal("信息缺失", "请输入证件号");
    if (!schoolID) return showModal("信息缺失", "请输入学号");
    if (!/\d{10}/.test(schoolID))
      return showModal("信息有误", "学号应为10位数字");
    if (!captcha) return showModal("信息缺失", "请输入验证码");

    const options = {
      type: "info",
      name,
      id,
      idType: idTypes[idTypeIndex],
      schoolID,
      captcha,
    } as const;

    wx.showLoading({ title: "正在验证" });

    const data = await (useOnlineService(PAGE_ID)
      ? <Promise<ActivateInfoResponse>>activateAccountOnline(options)
      : checkAccount(options));

    wx.hideLoading();

    if (data.success) {
      this.state.activationId = data.activationId;

      return this.setData({ stage: "phone" });
    }

    showModal("信息有误", data.msg);

    return this.getCaptcha();
  },

  async sendSMS() {
    if (get(ACTIVATE_SMS_KEY)) return showModal("验证码已发送", "请勿重复发送");

    const { mobile } = this.data;

    if (!/1\d{10}/.test(mobile)) {
      showModal("手机号码有误", "请输入正确的手机号");

      return;
    }

    const options: ActivatePhoneSmsOptions = {
      type: "sms",
      mobile,
      activationId: this.state.activationId,
    };

    wx.showLoading({ title: "发送中" });

    const data = await (useOnlineService(PAGE_ID)
      ? <Promise<ActivatePhoneSmsResponse>>activateAccountOnline(options)
      : sendSms(options));

    wx.hideLoading();

    if (data.success) {
      showToast("发送成功", 1000, "success");
      set(ACTIVATE_SMS_KEY, true, 10 * MINUTE);
    } else showModal("验证码发送失败", data.msg);
  },

  async bindPhone() {
    const { mobile, smsCode } = this.data;

    const options: ActivateBindPhoneOptions = {
      type: "bind-phone",
      mobile,
      activationId: this.state.activationId,
      code: smsCode,
    };

    wx.showLoading({ title: "绑定中" });

    const data = await (useOnlineService(PAGE_ID)
      ? <Promise<ActivateBindPhoneResponse>>activateAccountOnline(options)
      : bindPhone(options));

    wx.hideLoading();

    if (data.success) this.setData({ stage: "password" });
    else if (data.type === "conflict")
      showModal(
        "手机号冲突",
        `${data.msg}是否绑定该手机号？`,
        () => {
          const options: ActivateReplacePhoneOptions = {
            type: "replace-phone",
            mobile,
            activationId: this.state.activationId,
            code: smsCode,
          };

          (useOnlineService(PAGE_ID)
            ? <Promise<ActivateReplacePhoneResponse>>(
                activateAccountOnline(options)
              )
            : replacePhone(options)
          ).then((data) => {
            if (data.success) this.setData({ stage: "password" });
            else showModal("替换失败", data.msg);
          });
        },
        () => {
          // do nothing
        },
      );
    else showModal("绑定失败", data.msg);
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

    const options: ActivatePasswordOptions = {
      type: "password",
      password,
      activationId: this.state.activationId,
    };

    const data = await (useOnlineService(PAGE_ID)
      ? <Promise<ActivatePasswordResponse>>activateAccountOnline(options)
      : setPassword(options));

    wx.hideLoading();

    if (data.success) this.setData({ stage: "success" });
    else showModal("设置密码失败", data.msg);
  },
});

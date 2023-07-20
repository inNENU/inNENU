import { $Page } from "@mptool/all";

import {
  activateAccountOnline,
  bindPhone,
  checkAccount,
  getImage,
  idTypes,
  replacePhone,
  sendSms,
  setPassword,
} from "./api.js";
import type {
  ActivateBindPhoneOptions,
  ActivateBindPhoneResponse,
  ActivateImageResponse,
  ActivateInfoResponse,
  ActivatePasswordOptions,
  ActivatePasswordResponse,
  ActivatePhoneSmsOptions,
  ActivatePhoneSmsResponse,
  ActivateReplacePhoneOptions,
  ActivateReplacePhoneResponse,
} from "./typings.js";
import { showModal, showToast } from "../../api/ui.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, assets } from "../../config/info.js";
import { popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const PAGE_ID = "activate";
const PAGE_TITLE = "账号激活";

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

    footer: {
      desc: "『激活说明』\n小程序提供和官方相同的激活流程，您所填写的信息会直接发送(或经小程序转发)给官方服务器，在这一过程中，Mr.Hope 不会收集并存储您的任何信息。",
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
    const { account } = globalData;

    if (account) showModal("无需激活", "当前已登陆统一身份认证账户");
    else this.getCaptcha();
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

    this.setData({ [id]: value });
  },

  getCaptcha() {
    return (
      useOnlineService(PAGE_ID)
        ? <Promise<ActivateImageResponse>>activateAccountOnline("GET")
        : getImage()
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
    const { mobile } = this.data;

    if (mobile.length !== 11) {
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

    if (data.success) showToast("发送成功", 1000, "success");
    else showModal("验证码发送失败", data.msg);
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

    if (password !== confirmPassword) {
      showModal("密码不一致", "请确认两次输入的密码一致");

      return;
    }

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

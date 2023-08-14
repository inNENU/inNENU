import { $Page } from "@mptool/all";

import { activateEmail, getEmailInfo, onlineEmail } from "./api.js";
import { ActivateEmailOptions } from "./typings.js";
import { showModal, showToast } from "../../api/ui.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, appName, assets } from "../../config/info.js";
import { ensureMyLogin } from "../../login/my.js";
import { popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const PAGE_ID = "email";
const PAGE_TITLE = "校园邮箱";

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,
    logo:
      globalData.env === "qq"
        ? `${assets}img/inNENU.png`
        : "/frameset/placeholder.png",

    nav: {
      title: PAGE_TITLE,
      statusBarHeight: globalData.info.statusBarHeight,
      from: "返回",
    },

    footer: {
      desc: "『隐私说明』\n使用过程中的所有数据均会直接(或经小程序)接收自/发送到官方服务器，在这一过程中，Mr.Hope 不会收集并存储您的任何信息。",
    },

    isCustom: false,

    accounts: <string[]>[],
    accountIndex: 0,
    /** 自定义邮箱名称 */
    name: "",
    /** 邮箱数字后缀 */
    suffix: "",
    /** 邮箱初始密码 */
    password: "",
    /** 确认密码 */
    confirmPassword: "",
    /** 密保电话 */
    phone: "",

    status: <"success" | "error" | "login">"success",
    type: <"apply" | "email" | "loading">"loading",
  },

  state: {
    taskId: "",
    instanceId: "",
  },

  onLoad() {
    const { account } = globalData;

    if (account) {
      wx.showLoading({ title: "加载中" });

      ensureMyLogin(account, true).then((err) => {
        if (err) {
          wx.hideLoading();
          showToast(err.msg);
          this.setData({ status: "error" });
        } else {
          (useOnlineService("email") ? onlineEmail : getEmailInfo)().then(
            (res) => {
              wx.hideLoading();

              if (res.success) {
                if (res.hasEmail) {
                  showModal(
                    "已申请邮箱",
                    `您已有我校邮箱 ${res.email}@nenu.edu.cn。`,
                    () => {
                      this.$back();
                    },
                  );
                } else {
                  const { accounts, taskId, instanceId } = res;

                  this.state = { taskId, instanceId };
                  this.setData({
                    type: "apply",
                    accounts: ["请选择", ...accounts, "自定义"],
                  });
                }
              } else this.setData({ status: "error" });
            },
          );
        }
      });
    } else {
      this.setData({ status: "login" });
    }
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/pages/email/email",
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

  picker({ detail }: WechatMiniprogram.PickerChange) {
    const accountIndex = Number(detail.value);
    const isCustom = this.data.accounts.length - 1 === accountIndex;

    if (isCustom)
      wx.showModal({
        title: "自定义提示",
        content: `学校对学生申请的邮箱格式进行了限制，原则上您只能从上方的账户中进行选择，而不能申请任意邮箱。您正在利用 ${appName} 强行绕过学校的限制。造成的风险与后果请您自负！`,
        confirmText: "继续操作",
        cancelText: "正常申请",
        success: ({ confirm }) => {
          if (confirm)
            wx.showModal({
              title: "风险提示",
              content: `您正在利用 ${appName} 强行绕过学校的限制自定义邮箱名称，这很可能会造成不可预料的后果。Mr.Hope 建议您按照学校流程申请邮箱，继续操作意味着您已了解并同意自行承担此行为的风险与后果！`,
              confirmText: "继续操作",
              cancelText: "正常申请",
              success: ({ confirm }) => {
                if (confirm) this.setData({ accountIndex, isCustom });
              },
            });
        },
      });
    else this.setData({ accountIndex, isCustom });
  },

  apply() {
    const {
      accounts,
      accountIndex,
      isCustom,
      name,
      password,
      suffix,
      confirmPassword,
      phone,
    } = this.data;

    if (isCustom) {
      if (!name) return showModal("无法申请", "请输入自定义邮箱名称");

      if (!/^[a-z][a-z0-9-]*[a-z]$/.test(name))
        return showModal(
          "邮箱名字有误",
          "邮箱名称只能包含小写字母、数字和减号",
        );

      if (name.length < 5 || name.length > 15)
        return showModal(
          "邮箱名长度错误",
          "邮箱长度需要在 5 - 15 个字符之间。",
        );
    } else {
      if (accountIndex === 0 || accountIndex === accounts.length - 1)
        return showModal("未选择邮箱名称", "请选择一个合适的邮箱名称");
      if (suffix) {
        const suffixNumber = Number(suffix);

        if (
          Number.isNaN(suffix) ||
          suffixNumber < 100 ||
          suffixNumber > 999 ||
          Math.floor(suffixNumber) !== suffixNumber
        )
          return showModal(
            "后缀设置有误",
            "请设置一个 100 到 999 之间的三位数字",
          );
      }
    }

    if (password) {
      if (confirmPassword !== password)
        return showModal(
          "密码设置有误",
          "两次输入的密码不一致，请留空或输入一致的密码",
        );

      if (!/^[A-z0-9]{10,16}$/.test(password))
        return showModal(
          "密码不符合规则",
          "密码长度应在 10 至 16 位之间，且同时包含大写字母、小写字母和数字，不能包含符号。您可以留空来使用默认密码。",
        );
    }

    if (!/^1\d{10}$/.test(phone))
      return showModal("手机号码有误", "请输入正确的 11 位手机号码。");

    const { taskId, instanceId } = this.state;

    wx.showLoading({ title: "加载中" });

    const options: ActivateEmailOptions = {
      type: "set",
      ...(isCustom
        ? { name }
        : { name: accounts[accountIndex], suffix: suffix ?? "" }),
      ...(password ? { emailPassword: password } : {}),
      phone,
      taskId,
      instanceId,
    };

    showModal(
      "信息确认",
      `\
您正在申请我校邮箱。
账号: ${options.name}${options.suffix || ""}@nenu.edu.cn
${
  options.emailPassword
    ? `\
密码: ${options.emailPassword}
`
    : ""
}\
密保手机: ${phone}
`,
    );

    return (useOnlineService("email") ? onlineEmail : activateEmail)(
      options,
    ).then((res) => {
      wx.hideLoading();

      if (res.success)
        showModal(
          "已申请邮箱",
          `您已成功申请邮箱 ${res.email}，密码为 ${password}。`,
          () => {
            // TODO: Update
            this.$back();
            // this.setData({ type: "email" });
          },
        );
      else showModal("申请邮箱失败", res.msg);
    });
  },
});

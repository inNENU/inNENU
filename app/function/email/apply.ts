import { $Page } from "@mptool/all";

import type { ActivateEmailOptions } from "./email-apply.js";
import { activateEmail, getEmail, onlineMyEmail } from "./email-apply.js";
import { setClipboard, showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, appName, assets } from "../../config/info.js";
import { ensureMyLogin } from "../../login/my.js";
import { popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const MAIL_LINK = "https://mail.nenu.edu.cn";
const PAGE_ID = "apply-email";
const PAGE_TITLE = "校园邮箱申请";

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

    isCustom: false,

    accounts: <string[]>[],
    accountIndex: 0,
    /** 自定义邮箱名称 */
    name: "",
    /** 邮箱数字后缀 */
    suffix: "",
    /** 密保电话 */
    phone: "",

    status: <"success" | "error" | "login">"success",
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
    taskId: "",
    instanceId: "",
  },

  onShow() {
    const { account } = globalData;

    if (account) {
      this.setData({ status: "success" });
      this.checkEmail();
    } else {
      this.setData({ status: "login" });
    }

    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/pages/email/apply",
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

  async checkEmail() {
    wx.showLoading({ title: "加载中" });

    const err = await ensureMyLogin(
      globalData.account!,
      this.state.loginMethod,
    );

    if (err) {
      wx.hideLoading();
      showToast(err.msg);
      this.state.loginMethod = "login";

      return this.setData({ status: "error" });
    }

    const result = await (useOnlineService("check-email")
      ? onlineMyEmail
      : getEmail)();

    wx.hideLoading();

    if (result.success) {
      if (result.hasEmail)
        return showModal(
          "已有邮箱",
          `您已有邮箱${result.email}，无法再次申请。`,
          () => {
            this.$back();
          },
        );

      const { accounts, taskId, instanceId } = result;

      this.state = {
        ...this.state,
        loginMethod: "check",
        taskId,
        instanceId,
      };
      this.state.loginMethod = "check";

      return this.setData({
        accounts: ["请选择", ...accounts, "自定义"],
      });
    }

    this.state.loginMethod = "login";

    return this.setData({ status: "error" });
  },

  apply() {
    const { accounts, accountIndex, isCustom, name, suffix, phone } = this.data;
    const { userInfo } = globalData;
    const shouldApplyOnline = useOnlineService(PAGE_ID);

    if (!shouldApplyOnline && !userInfo)
      return showModal(
        "个人信息缺失",
        `小程序本地暂无个人信息，请重新登录`,
        () => {
          this.$go(`account?update=true`);
        },
      );

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

    if (!/^1\d{10}$/.test(phone))
      return showModal("手机号码有误", "请输入正确的 11 位手机号码。");

    const { taskId, instanceId } = this.state;

    const options: ActivateEmailOptions = {
      type: "set",
      ...(isCustom
        ? { name }
        : { name: accounts[accountIndex], suffix: suffix ?? "" }),
      phone,
      taskId,
      instanceId,
    };

    showModal(
      "信息确认",
      `\
您正在申请我校邮箱。
账号: ${options.name}${options.suffix || ""}@nenu.edu.cn
密保手机: ${phone}
`,
      () => {
        wx.showLoading({ title: "申请中" });

        void (
          shouldApplyOnline
            ? onlineMyEmail(options)
            : activateEmail(options, userInfo!)
        ).then((res) => {
          wx.hideLoading();

          if (res.success) {
            const hint = `
您已成功申请邮箱 ${res.email}，密码为 ${res.password}。
特别提示：未初始化前，邮箱无法正常使用。
请截屏保存密码，并\
`;

            if (globalData.env === "app") {
              showModal(
                "已申请邮箱",
                `\
${hint}立即登录初始化邮箱。
`,
                () => {
                  this.$go(`web?url=${encodeURIComponent(MAIL_LINK)}`);
                },
              );
            } else {
              setClipboard(MAIL_LINK).then(() => {
                showModal(
                  "已申请邮箱",
                  `\
${hint}立即前往 ${MAIL_LINK} 手动登录初始化邮箱。(网址已复制到剪切板)。
`,
                  () => {
                    this.$back();
                  },
                );
              });
            }
          } else showModal("申请邮箱失败", res.msg);
        });
      },
      () => {
        // do nothing
      },
    );
  },

  retry() {
    return this.checkEmail();
  },
});
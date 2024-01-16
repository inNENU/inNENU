import { $Page } from "@mptool/all";

import { setClipboard, showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, assets } from "../../config/info.js";
import {
  emailPage,
  ensureActionLogin,
  onlineEmailPage,
  onlineRecentEmails,
  recentEmails,
} from "../../service/index.js";
import { info } from "../../utils/info.js";
import { popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const PAGE_ID = "email";
const PAGE_TITLE = "校园邮箱";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    logo:
      info.env === "qq"
        ? `${assets}img/inNENU.png`
        : "/frameset/placeholder.png",

    nav: {
      title: PAGE_TITLE,
      statusBarHeight: info.statusBarHeight,
      from: "返回",
    },

    recent: <{ subject: string; name: string; mid: string; date: string }[]>[],

    status: <"success" | "error" | "login">"success",
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
  },

  onShow() {
    const { account } = globalData;

    if (account) {
      this.setData({ status: "success" });
      this.getEmails();
    } else {
      this.setData({ status: "login" });
    }

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

  async getEmails() {
    wx.showLoading({ title: "获取邮件" });

    const err = await ensureActionLogin(
      globalData.account!,
      this.state.loginMethod,
    );

    if (err) {
      wx.hideLoading();
      showModal(
        "获取邮件失败",
        "请确认已手动登录邮箱，完成开启手机密保与修改初始密码工作。",
      );
      this.state.loginMethod = "login";

      return this.setData({ status: "error" });
    }

    const result = await (
      useOnlineService("recent-email") ? onlineRecentEmails : recentEmails
    )();

    wx.hideLoading();

    if (result.success) {
      this.setData({
        unread: result.unread,
        recent: result.recent.map(({ receivedDate, ...item }) => ({
          date: new Date(receivedDate).toLocaleDateString(),
          ...item,
        })),
      });
      this.state.loginMethod = "check";
    } else if (result.type === "not-initialized") {
      wx.showModal({
        title: "无法读取",
        content: `\
用户无邮箱或邮箱未初始化。
如无邮箱请申请。
如已申请请通过初始密码登录邮箱，修改初始密码并开启手机密保。
您可点击申请邮箱查看初始密码。\
`,
        confirmText: "申请邮箱",
        cancelText: "我已了解",
        success: (res) => {
          if (res.confirm) this.$go("apply-email");
        },
      });
      this.setData({ status: "error" });
    } else {
      showModal("获取失败", result.msg);
      this.setData({ status: "error" });
      this.state.loginMethod = "login";
    }
  },

  async openEmail({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { mid: string }
  >) {
    wx.showLoading({ title: "加载中" });

    const err = await ensureActionLogin(
      globalData.account!,
      this.state.loginMethod,
    );

    if (err) {
      wx.hideLoading();
      showToast(err.msg);
      this.state.loginMethod = "login";

      return this.setData({ status: "error" });
    }

    const result = await (
      useOnlineService("email-page") ? onlineEmailPage : emailPage
    )(currentTarget.dataset.mid);

    wx.hideLoading();

    if (result.success) {
      const { url } = result;

      if (info.env === "app")
        return this.$go(`web?url=${encodeURIComponent(url)}`);

      await setClipboard(url);

      showModal(
        "复制成功",
        "相关链接已复制到剪切板。受小程序限制，请使用浏览器打开。",
      );
      this.state.loginMethod = "check";
    } else {
      showToast("加载页面失败");
      this.state.loginMethod = "login";
    }
  },

  retry() {
    return this.getEmails();
  },
});

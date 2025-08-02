import { $Page, env, showModal, showToast, writeClipboard } from "@mptool/all";

import { appCoverPrefix, logo } from "../../../../config/index.js";
import {
  ActionFailType,
  getEmailPage,
  getRecentEmails,
} from "../../../../service/index.js";
import { info, user, windowInfo } from "../../../../state/index.js";
import { showNotice } from "../../../../utils/index.js";

const PAGE_ID = "email-recent";
const PAGE_TITLE = "校园邮箱";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    logo,

    nav: {
      title: PAGE_TITLE,
      statusBarHeight: windowInfo.statusBarHeight,
      from: "返回",
    },

    recent: [] as {
      subject: string;
      name: string;
      mid: string;
      date: string;
    }[],

    status: "loading" as "success" | "error" | "login" | "loading",
  },

  onShow() {
    if (user.account) {
      this.setData({ status: "loading" });
      this.getEmails();
    } else {
      this.setData({ status: "login" });
    }

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

  async getEmails(): Promise<void> {
    wx.showLoading({ title: "获取邮件" });

    const result = await getRecentEmails();

    wx.hideLoading();

    if (result.success) {
      this.setData({
        status: "success",
        unread: result.data.unread,
        recent: result.data.emails.map(({ receivedDate, ...item }) => ({
          date: new Date(receivedDate).toLocaleDateString(),
          ...item,
        })),
      });
    } else if (result.type === ActionFailType.NotInitialized) {
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
          if (res.confirm) this.$go("email-apply");
        },
      });
      this.setData({ status: "error" });
    } else {
      console.error(result.msg);
      showModal(
        "获取邮件失败",
        "请确认已手动登录邮箱，完成开启手机密保与修改初始密码工作。",
      );
      this.setData({ status: "error" });
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

    const result = await getEmailPage(currentTarget.dataset.mid);

    wx.hideLoading();

    if (result.success) {
      const { data } = result;

      if (env === "donut") this.$go(`web?url=${encodeURIComponent(data)}`);
      else {
        await writeClipboard(data);
        showModal(
          "复制成功",
          "相关链接已复制到剪切板。受小程序限制，请使用浏览器打开。",
        );
      }
    } else {
      showToast("加载页面失败");
    }
  },
});

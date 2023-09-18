import { $Component, PropType, get, set } from "@mptool/all";

import type { EmailItem } from "./recent-email.js";
import {
  emailPage,
  onlineEmailPage,
  onlineRecentEmails,
  recentEmails,
} from "./recent-email.js";
import { setClipboard, showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { EMAIL_DATA_KEY } from "../../config/keys.js";
import { LoginFailType, ensureActionLogin } from "../../login/index.js";
import { MINUTE } from "../../utils/constant.js";
import type { WidgetStatus } from "../utils.js";
import { getSize } from "../utils.js";

const { globalData, useOnlineService } = getApp<AppOption>();

interface Mail extends Exclude<EmailItem, "receivedDate"> {
  shortDate: string;
  date: string;
}

let loginMethod: "check" | "login" = "check";

$Component({
  properties: {
    type: {
      type: String as PropType<
        "未读邮件 (小)" | "最近邮件 (小)" | "最近邮件" | "最近邮件 (大)"
      >,
      default: "最近邮件",
    },
  },

  data: {
    data: <Mail[]>[],
    status: <WidgetStatus>"loading",
  },

  lifetimes: {
    attached() {
      const { account } = globalData;
      const { type } = this.data;

      this.setData({
        header: type.includes("未读") ? "未读邮件" : "近期邮件",
        size: getSize(type),
      });

      if (account) {
        const emails = get<Mail[]>(EMAIL_DATA_KEY);

        if (emails) {
          const unreadEmails = emails.filter(({ unread }) => unread);

          this.setData({
            status: "success",
            unread: unreadEmails.length,
            recent: type.includes("未读") ? unreadEmails : emails,
          });
        } else {
          this.getEmails();
        }
      } else {
        this.setData({ status: "login" });
      }
    },
  },

  pageLifetimes: {
    show() {
      const { account } = globalData;

      if (account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getEmails();
        }
      } else {
        this.setData({ status: "login" });
      }
    },
  },

  methods: {
    async getEmails(): Promise<void> {
      const { type } = this.data;

      const err = await ensureActionLogin(globalData.account!, loginMethod);

      if (err) {
        if (loginMethod === "check") {
          loginMethod = "login";

          return this.getEmails();
        }

        return this.setData({ status: "error" });
      }

      const result = await (useOnlineService("recent-email")
        ? onlineRecentEmails
        : recentEmails)();

      if (result.success) {
        const recent = result.recent.map(({ receivedDate, ...rest }) => {
          const date = new Date(receivedDate);

          return {
            ...rest,
            date: date.toLocaleDateString(),
            shortDate: `${date.getMonth() + 1}/${date.getDate()}`,
          };
        });

        this.setData({
          status: "success",
          unread: result.unread,
          recent: type.includes("未读")
            ? recent.filter(({ unread }) => unread)
            : recent,
        });
        set(EMAIL_DATA_KEY, recent, 5 * MINUTE);
      } else if (result.type === LoginFailType.Expired) {
        loginMethod = "login";

        return this.getEmails();
      } else this.setData({ status: "error", hint: result.msg });
    },

    async openEmail({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<never, never>,
      Record<never, never>,
      { mid: string }
    >) {
      const { mid } = currentTarget.dataset;

      const err = await ensureActionLogin(globalData.account!, loginMethod);

      if (err) {
        if (loginMethod === "check") {
          loginMethod = "login";

          return showToast(err.msg);
        }
      }

      const result = await (useOnlineService("email-page")
        ? onlineEmailPage
        : emailPage)(mid);

      if (result.success) {
        const { url } = result;

        if (globalData.env === "app")
          return this.$go(`web?url=${encodeURIComponent(url)}`);

        await setClipboard(url);

        showModal(
          "复制成功",
          "相关链接已复制到剪切板。受小程序限制，请使用浏览器打开。",
        );
        loginMethod = "check";
      } else {
        showToast("加载页面失败");
        loginMethod = "login";
      }
    },

    retry() {
      this.setData({ status: "loading" });

      return this.getEmails();
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

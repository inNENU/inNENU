import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { copyContent, showModal, showToast } from "../../api/index.js";
import { EMAIL_DATA_KEY, MINUTE } from "../../config/index.js";
import type { EmailItem, LoginMethod } from "../../service/index.js";
import {
  LoginFailType,
  ensureActionLogin,
  getEmailPage,
  getRecentEmails,
} from "../../service/index.js";
import { env, user } from "../../state/index.js";
import type { LoginWidgetStatus } from "../utils.js";
import { getSize } from "../utils.js";

interface Mail extends Exclude<EmailItem, "receivedDate"> {
  shortDate: string;
  date: string;
}

$Component({
  props: {
    type: {
      type: String as PropType<
        "未读邮件 (小)" | "最近邮件 (小)" | "最近邮件" | "最近邮件 (大)"
      >,
      default: "最近邮件",
    },
  },

  data: {
    data: [] as Mail[],
    loginMethod: "validate" as LoginMethod,
    status: "loading" as LoginWidgetStatus,
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData({
        header: type.includes("未读") ? "未读邮件" : "近期邮件",
        size: getSize(type),
      });

      if (user.account) {
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
      if (user.account) {
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

      const err = await ensureActionLogin(user.account!, this.data.loginMethod);

      if (err) {
        return this.setData({
          loginMethod: "force",
          status: "error",
          errMsg: "登陆失败",
        });
      }

      const result = await getRecentEmails();

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
        this.setData({ loginMethod: "force" });

        return this.getEmails();
      } else this.setData({ status: "error", errMsg: result.msg });
    },

    async openEmail({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<never, never>,
      Record<never, never>,
      { mid?: string }
    >) {
      const { status } = this.data;

      if (status === "error") return this.$go("email-recent");

      const { mid } = currentTarget.dataset;

      const err = await ensureActionLogin(user.account!, this.data.loginMethod);

      if (err) {
        this.setData({ loginMethod: "force" });

        return showToast(err.msg);
      }

      const result = await getEmailPage(mid);

      if (result.success) {
        const { data } = result;

        if (env === "app")
          return this.$go(`web?url=${encodeURIComponent(data)}`);

        await copyContent(data);

        showModal(
          "复制成功",
          "相关链接已复制到剪切板。受小程序限制，请使用浏览器打开。",
        );
        this.setData({ loginMethod: "check" });
      } else {
        showToast("加载页面失败");
        this.setData({ loginMethod: "force" });
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

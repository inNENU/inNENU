import { $Component, get, set } from "@mptool/all";

import { getNoticeList, getOnlineNoticeList } from "./api.js";
import type { NoticeItem } from "./typings.js";
import { showToast } from "../../api/ui.js";
import type { AppOption } from "../../app.js";
import { NOTICE_LIST_KEY } from "../../config/keys.js";
import { ensureActionLogin } from "../../login/action.js";
import { HOUR } from "../../utils/constant.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const FILTERED_SOURCES = [
  "国际合作与交流处",
  "人事处",
  "科学技术处",
  "发展规划处",
  "社会科学处",
  "资产与实验室管理处",
  "职业与继续教育学院",
  "工会",
];

$Component({
  data: {
    status: <"loading" | "error" | "login" | "success">"loading",
    notices: <NoticeItem[]>[],
  },

  lifetimes: {
    attached() {
      const notices = get<NoticeItem[]>(NOTICE_LIST_KEY);

      if (notices) this.setData({ status: "success", notices });
      else this.getNoticeList("validate");
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getNoticeList("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getNoticeList(status: "check" | "login" | "validate" = "check") {
      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await (useOnlineService("notice-list")
            ? getOnlineNoticeList
            : getNoticeList)({});

          if (result.success) {
            const notices = result.data
              .filter(({ from }) => !FILTERED_SOURCES.includes(from))
              .map(({ title, ...rest }) => ({
                title: title.replace(/^关于/g, "").replace(/的通知$/g, ""),
                ...rest,
              }))
              .slice(0, 5);

            this.setData({
              status: "success",
              notices,
            });
            set(NOTICE_LIST_KEY, notices, HOUR);
          } else {
            this.setData({ status: "error" });
          }
        } catch (err) {
          this.setData({ status: "error" });
        }
      } else this.setData({ status: "login" });
    },

    viewNotice({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const { index } = currentTarget.dataset;
      const { title, id } = this.data.notices[index];

      return this.$go(`notice-detail?title=${title}&id=${id}&type=notice`);
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getNoticeList();
    },

    retry() {
      this.setData({ status: "loading" });
      this.getNoticeList("login");
    },
  },

  externalClasses: ["custom-class"],
});

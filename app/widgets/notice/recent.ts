import { $Component, PropType, get, set } from "@mptool/all";

import type { NoticeItem } from "./getList.js";
import { getNoticeList, getOnlineNoticeList } from "./getList.js";
import { showToast } from "../../api/ui.js";
import type { AppOption } from "../../app.js";
import { NEWS_LIST_KEY, NOTICE_LIST_KEY } from "../../config/keys.js";
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
  properties: {
    type: {
      type: String as PropType<
        | "通知（小）"
        | "通知"
        | "通知（大）"
        | "新闻（小）"
        | "新闻"
        | "新闻（大）"
      >,
      default: "通知",
    },
  },

  data: {
    noticeType: "notice" as "notice" | "news",
    status: <"loading" | "error" | "login" | "success">"loading",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;
      const noticeType = type.includes("新闻") ? "news" : "notice";

      this.setData(
        {
          noticeType,
          size: type.includes("大")
            ? "large"
            : type.includes("小")
            ? "small"
            : "medium",
        },
        () => {
          const data = get<NoticeItem[]>(
            noticeType === "news" ? NEWS_LIST_KEY : NOTICE_LIST_KEY,
          );

          if (data) this.setData({ status: "success", data });
          else this.getNoticeList("validate");
        },
      );
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
      const { noticeType } = this.data;

      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await (useOnlineService("notice-list")
            ? getOnlineNoticeList
            : getNoticeList)({
            type: noticeType,
          });

          if (result.success) {
            const data = result.data
              .filter(({ from }) => !FILTERED_SOURCES.includes(from))
              .map(({ title, id }) => ({
                title: title.replace(/^关于/g, "").replace(/的通知$/g, ""),
                id,
              }))
              .slice(0, 5);

            this.setData({ status: "success", data });
            set(
              noticeType === "news" ? NEWS_LIST_KEY : NOTICE_LIST_KEY,
              data,
              HOUR,
            );
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
      { notice: { title: string; id: string } }
    >) {
      const { noticeType } = this.data;
      const { title, id } = currentTarget.dataset.notice;

      return this.$go(
        `notice-detail?title=${title}&id=${id}&type=${noticeType}`,
      );
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

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

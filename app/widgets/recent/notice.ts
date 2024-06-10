import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { showToast } from "../../api/index.js";
import { HOUR, NEWS_LIST_KEY, NOTICE_LIST_KEY } from "../../config/index.js";
import type { NoticeItem, NoticeType } from "../../service/index.js";
import { ensureActionLogin, getNoticeList } from "../../service/index.js";
import { user } from "../../state/index.js";
import type { WidgetSize, WidgetStatus } from "../utils.js";
import { FILTERED_SOURCES, getSize } from "../utils.js";

const getKey = (type: NoticeType): string =>
  type === "news" ? NEWS_LIST_KEY : NOTICE_LIST_KEY;

$Component({
  properties: {
    type: {
      type: String as PropType<
        "通知 (小)" | "通知" | "通知 (大)" | "新闻 (小)" | "新闻" | "新闻 (大)"
      >,
      default: "通知",
    },
  },

  data: {
    size: "medium" as WidgetSize,
    noticeType: "notice" as NoticeType,
    status: "loading" as WidgetStatus,
  },

  lifetimes: {
    attached() {
      const { type } = this.data;
      const noticeType = type.includes("新闻") ? "news" : "notice";
      const size = getSize(type);

      this.setData(
        {
          noticeType,
          size,
        },
        () => {
          const data = get<NoticeItem[]>(getKey(noticeType));

          if (data)
            this.setData({
              status: "success",
              data: size === "large" ? data : data.slice(0, 5),
            });
          else this.getNoticeList("validate");
        },
      );
    },
  },

  pageLifetimes: {
    show() {
      if (user.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getNoticeList("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getNoticeList(status: "check" | "login" | "validate" = "check") {
      const { noticeType, size } = this.data;

      if (user.account) {
        const err = await ensureActionLogin(user.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await getNoticeList({
            type: noticeType,
          });

          if (result.success) {
            const data = result.data
              .filter(({ from }) => !FILTERED_SOURCES.includes(from))
              .map(({ title, id }) => ({
                title: title.replace(/^关于/g, "").replace(/的通知$/g, ""),
                id,
              }));

            this.setData({
              status: "success",
              data: size === "large" ? data : data.slice(0, 5),
            });
            set(getKey(noticeType), data, HOUR);
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

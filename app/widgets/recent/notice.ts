import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { HOUR, NEWS_LIST_KEY, NOTICE_LIST_KEY } from "../../config/index.js";
import type {
  LoginMethod,
  NoticeInfo,
  NoticeType,
} from "../../service/index.js";
import { getNoticeList } from "../../service/index.js";
import { user } from "../../state/index.js";
import type { WidgetSize, WidgetStatus } from "../utils.js";
import { FILTERED_SOURCES, getSize } from "../utils.js";

const getKey = (type: NoticeType): string =>
  type === "news" ? NEWS_LIST_KEY : NOTICE_LIST_KEY;

$Component({
  props: {
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
    loginMethod: "validate" as LoginMethod,
  },

  lifetimes: {
    attached(): void {
      const { type } = this.data;
      const noticeType = type.includes("新闻") ? "news" : "notice";
      const size = getSize(type);

      this.setData({ noticeType, size }, () => {
        const data = get<NoticeInfo[]>(getKey(noticeType));

        if (data)
          this.setData({
            status: "success",
            data: size === "large" ? data : data.slice(0, 5),
          });
        else this.getNoticeList();
      });
    },
  },

  pageLifetimes: {
    show(): void {
      if (!user.account) return this.setData({ status: "login" });

      if (this.data.status === "login") {
        this.setData({ status: "loading" });
        this.getNoticeList();
      }
    },
  },

  methods: {
    async getNoticeList() {
      const { noticeType, size } = this.data;

      if (!user.account) return this.setData({ status: "login" });

      this.setData({ status: "loading" });

      const result = await getNoticeList({ type: noticeType });

      if (!result.success)
        return this.setData({ status: "error", errMsg: result.msg });

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
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

import { $Component, PropType, get } from "@mptool/all";

import { StarredNotice } from "./notice.js";
import type { AppOption } from "../../app.js";
import { STARRED_NOTICE_LIST_KEY } from "../../config/keys.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    type: {
      type: String as PropType<"收藏（小）" | "收藏">,
      default: "收藏",
    },
  },

  data: {
    size: <"small" | "medium">"medium",
    status: <"login" | "success">"loading",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData(
        {
          size: type.includes("小") ? "small" : "medium",
        },
        () => {
          this.setNotice();
        },
      );
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        this.setData({ status: "success" });
        this.setNotice();
      } else {
        this.setData({ status: "login" });
      }
    },
  },

  methods: {
    setNotice() {
      const { size } = this.data;
      const notices = get<StarredNotice[]>(STARRED_NOTICE_LIST_KEY) || [];

      this.setData({
        data:
          size === "small"
            ? notices.map(({ title, ...rest }) => ({
                ...rest,
                title: title.replace(/^关于/g, "").replace(/的通知$/g, ""),
              }))
            : notices,
      });
    },

    viewNotice({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const notices = get<StarredNotice[]>(STARRED_NOTICE_LIST_KEY) || [];
      const { index } = currentTarget.dataset;
      const { title, id, type } = notices[index];

      return this.$go(`notice-detail?title=${title}&id=${id}&type=${type}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

import type { PropType } from "@mptool/all";
import { $Component, get } from "@mptool/all";

import type { StarredNotice } from "./typings.js";
import { STARRED_NOTICE_LIST_KEY } from "../../config/index.js";
import { user } from "../../state/index.js";
import type { WidgetSize } from "../utils.js";
import { getSize } from "../utils.js";

$Component({
  props: {
    type: {
      type: String as PropType<"通知收藏 (小)" | "通知收藏" | "通知收藏 (大)">,
      default: "通知收藏",
    },
  },

  data: {
    size: "medium" as WidgetSize,
    status: "loading" as "login" | "success",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData({ size: getSize(type) }, () => {
        this.setNotice();
      });
    },
  },

  pageLifetimes: {
    show() {
      if (user.account) {
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

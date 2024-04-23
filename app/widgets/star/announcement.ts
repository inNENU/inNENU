import type { PropType } from "@mptool/all";
import { $Component, get } from "@mptool/all";

import type { StarredAnnouncement } from "./typings.js";
import { STARRED_ANNOUNCEMENT_LIST_KEY } from "../../config/keys.js";
import type { WidgetSize } from "../utils.js";
import { getSize } from "../utils.js";

$Component({
  properties: {
    type: {
      type: String as PropType<"公告收藏 (小)" | "公告收藏" | "公告收藏 (大)">,
      default: "公告收藏",
    },
  },

  data: {
    size: "medium" as WidgetSize,
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData({ size: getSize(type) }, () => {
        this.setAnnouncement();
      });
    },
  },

  methods: {
    setAnnouncement() {
      const { size } = this.data;
      const announcements =
        get<StarredAnnouncement[]>(STARRED_ANNOUNCEMENT_LIST_KEY) || [];

      this.setData({
        data:
          size === "small"
            ? announcements.map(({ title, ...rest }) => ({
                ...rest,
                title: title.replace(/^关于/g, "").replace(/的通知$/g, ""),
              }))
            : announcements,
      });
    },

    viewNotice({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const announcements =
        get<StarredAnnouncement[]>(STARRED_ANNOUNCEMENT_LIST_KEY) || [];
      const { index } = currentTarget.dataset;
      const { title, url } = announcements[index];

      return this.$go(`announcement-detail?title=${title}&url=${url}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

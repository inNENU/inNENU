import type { PropType } from "@mptool/all";
import { $Component, get } from "@mptool/all";

import type { StarredAcademic } from "./typings.js";
import { STARRED_ACADEMIC_LIST_KEY } from "../../config/keys.js";
import type { WidgetSize } from "../utils.js";
import { getSize } from "../utils.js";

$Component({
  properties: {
    type: {
      type: String as PropType<"收藏会议 (小)" | "收藏会议" | "收藏会议 (大)">,
      default: "收藏会议",
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
      this.setData({
        data: get<StarredAcademic[]>(STARRED_ACADEMIC_LIST_KEY) || [],
      });
    },

    viewNotice({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const academics = get<StarredAcademic[]>(STARRED_ACADEMIC_LIST_KEY) || [];
      const { index } = currentTarget.dataset;
      const { title, url } = academics[index];

      return this.$go(`academic-detail?title=${title}&url=${url}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

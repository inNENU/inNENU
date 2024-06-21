import type { PropType } from "@mptool/all";
import { $Component, get } from "@mptool/all";

import type { StarredOfficialAcademicData } from "./typings.js";
import { STARRED_ACADEMIC_LIST_KEY } from "../../config/index.js";
import type { WidgetSize } from "../utils.js";
import { getSize } from "../utils.js";

$Component({
  props: {
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
        data:
          get<StarredOfficialAcademicData[]>(STARRED_ACADEMIC_LIST_KEY) || [],
      });
    },

    viewNotice({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const academics =
        get<StarredOfficialAcademicData[]>(STARRED_ACADEMIC_LIST_KEY) || [];
      const { index } = currentTarget.dataset;
      const { title, url } = academics[index];

      return this.$go(`official-academic-detail?title=${title}&url=${url}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

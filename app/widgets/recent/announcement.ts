import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { HOUR, SITE_ANNOUNCEMENT_LIST_KEY } from "../../config/index.js";
import type { OfficialNoticeInfoItem } from "../../service/index.js";
import { getOfficialNoticeList } from "../../service/index.js";
import type { WidgetSize, WidgetStatus } from "../utils.js";
import { FILTERED_SOURCES, getSize } from "../utils.js";

$Component({
  props: {
    type: {
      type: String as PropType<"通知公告 (小)" | "通知公告" | "通知公告 (大)">,
      default: "通知公告",
    },
  },

  data: {
    size: "medium" as WidgetSize,
    status: "loading" as WidgetStatus,
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      const size = getSize(type);

      this.setData({ size }, () => {
        const data = get<{ title: string; url: string }[]>(
          SITE_ANNOUNCEMENT_LIST_KEY,
        );

        if (data)
          this.setData({
            status: "success",
            data: size === "large" ? data : data.slice(0, 5),
          });
        else this.getNoticeList();
      });
    },
  },

  methods: {
    async getNoticeList() {
      this.setData({ status: "loading" });

      const { size } = this.data;
      const result = await getOfficialNoticeList();

      if (!result.success) return this.setData({ status: "error" });

      const data = result.data
        .filter(({ from }) => !FILTERED_SOURCES.includes(from))
        .map(({ title, url }) => ({
          title: title.replace(/^关于/g, "").replace(/的通知$/g, ""),
          url,
        }));

      this.setData({
        status: "success",
        data: size === "large" ? data : data.slice(0, 5),
      });
      set(SITE_ANNOUNCEMENT_LIST_KEY, data, HOUR);
    },

    viewInfo({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { info: OfficialNoticeInfoItem }
    >) {
      const { title, url } = currentTarget.dataset.info;

      return this.$go(`official-notice-detail?title=${title}&url=${url}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

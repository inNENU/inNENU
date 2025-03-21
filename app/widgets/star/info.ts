import type { PropType } from "@mptool/all";
import { $Component, get } from "@mptool/all";

import { STARRED_INFO_LIST_KEY } from "../../config/index.js";
import { user } from "../../state/index.js";
import type { StarredOfficialInfoData } from "../../typings/index.js";
import type { WidgetSize } from "../utils.js";
import { getSize } from "../utils.js";

$Component({
  props: {
    type: {
      type: String as PropType<"官网收藏 (小)" | "官网收藏" | "官网收藏 (大)">,
      default: "官网收藏",
    },
  },

  data: {
    size: "medium" as WidgetSize,
    status: "loading" as "login" | "success",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData({ size: getSize(type) }, () => this.setInfo());
    },
  },

  pageLifetimes: {
    show(): void {
      if (!user.account) return this.setData({ status: "login" });

      this.setData({ status: "success" });
      this.setInfo();
    },
  },

  methods: {
    setInfo() {
      const { size } = this.data;
      const infos = get<StarredOfficialInfoData[]>(STARRED_INFO_LIST_KEY) || [];

      this.setData({
        data:
          size === "small"
            ? infos.map(({ title, ...rest }) => ({
                ...rest,
                title: title.replace(/^关于/g, "").replace(/的通知$/g, ""),
              }))
            : infos,
      });
    },

    viewInfo({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const infos = get<StarredOfficialInfoData[]>(STARRED_INFO_LIST_KEY) || [];
      const { index } = currentTarget.dataset;
      const { title, url, type } = infos[index];

      this.$go(`official-info-detail?title=${title}&type=${type}&url=${url}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

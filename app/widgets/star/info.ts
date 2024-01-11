import { $Component, PropType, get } from "@mptool/all";

import { StarredInfo } from "./typings.js";
import type { AppOption } from "../../app.js";
import { STARRED_INFO_LIST_KEY } from "../../config/keys.js";
import { WidgetSize, getSize } from "../utils.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    type: {
      type: String as PropType<"官网收藏 (小)" | "官网收藏" | "官网收藏 (大)">,
      default: "官网收藏",
    },
  },

  data: {
    size: <WidgetSize>"medium",
    status: <"login" | "success">"loading",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData({ size: getSize(type) }, () => {
        this.setInfo();
      });
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        this.setData({ status: "success" });
        this.setInfo();
      } else {
        this.setData({ status: "login" });
      }
    },
  },

  methods: {
    setInfo() {
      const { size } = this.data;
      const infos = get<StarredInfo[]>(STARRED_INFO_LIST_KEY) || [];

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
      const infos = get<StarredInfo[]>(STARRED_INFO_LIST_KEY) || [];
      const { index } = currentTarget.dataset;
      const { title, url, type } = infos[index];

      return this.$go(`info-detail?title=${title}&type=${type}&url=${url}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});
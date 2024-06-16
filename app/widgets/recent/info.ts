import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { showToast } from "../../api/index.js";
import {
  HOUR,
  SITE_MEDIA_LIST_KEY,
  SITE_NEWS_LIST_KEY,
  SITE_SCIENCE_LIST_KEY,
  SITE_SOCIAL_LIST_KEY,
} from "../../config/index.js";
import type {
  OfficialInfoItem,
  OfficialInfoType,
} from "../../service/index.js";
import { ensureActionLogin, getOfficialInfoList } from "../../service/index.js";
import { user } from "../../state/index.js";
import type { WidgetSize, WidgetStatus } from "../utils.js";
import { getSize } from "../utils.js";

const getKey = (type: OfficialInfoType): string =>
  ({
    media: SITE_MEDIA_LIST_KEY,
    news: SITE_NEWS_LIST_KEY,
    science: SITE_SCIENCE_LIST_KEY,
    social: SITE_SOCIAL_LIST_KEY,
  })[type];

$Component({
  props: {
    type: {
      type: String as PropType<
        | "要闻速递 (小)"
        | "要闻速递"
        | "要闻速递 (大)"
        | "媒体报道 (小)"
        | "媒体报道"
        | "媒体报道 (大)"
        | "人文社科 (小)"
        | "人文社科"
        | "人文社科 (大)"
        | "自然科学 (小)"
        | "自然科学"
        | "自然科学 (大)"
      >,
      default: "要闻速递",
    },
  },

  data: {
    size: "medium" as WidgetSize,
    infoType: "news" as OfficialInfoType,
    status: "loading" as WidgetStatus,
  },

  lifetimes: {
    attached() {
      const { type } = this.data;
      const infoType = type.includes("自然科学")
        ? "science"
        : type.includes("人文社科")
          ? "social"
          : type.includes("要闻速递")
            ? "media"
            : "news";
      const size = getSize(type);

      this.setData(
        {
          header: type.replace(/\((小|大)\)/, ""),
          infoType,
          size,
        },
        () => {
          const data = get<OfficialInfoItem[]>(getKey(infoType));

          if (data)
            this.setData({
              status: "success",
              data: size === "large" ? data : data.slice(0, 5),
            });
          else this.getInfoList("validate");
        },
      );
    },
  },

  pageLifetimes: {
    show() {
      if (user.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getInfoList("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getInfoList(status: "check" | "login" | "validate" = "check") {
      const { infoType, size } = this.data;

      if (user.account) {
        const err = await ensureActionLogin(user.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await getOfficialInfoList({
            type: infoType,
          });

          if (result.success) {
            const data = result.data.map(({ title, url }) => ({ title, url }));

            this.setData({
              status: "success",
              data: size === "large" ? data : data.slice(0, 5),
            });
            set(getKey(infoType), data, HOUR);
          } else {
            this.setData({ status: "error" });
          }
        } catch (err) {
          this.setData({ status: "error" });
        }
      } else this.setData({ status: "login" });
    },

    viewInfo({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { info: OfficialInfoItem }
    >) {
      const { infoType: noticeType } = this.data;
      const { title, url } = currentTarget.dataset.info;

      return this.$go(
        `official-info-detail?title=${title}&type=${noticeType}&url=${url}`,
      );
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getInfoList();
    },

    retry() {
      this.setData({ status: "loading" });
      this.getInfoList("login");
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

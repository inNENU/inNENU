import { $Component, PropType, get, set } from "@mptool/all";

import type { InfoType } from "./info.js";
import type { InfoItem } from "./list.js";
import { getInfoList, getOnlineInfoList } from "./list.js";
import { showToast } from "../../api/ui.js";
import type { AppOption } from "../../app.js";
import {
  SITE_ACADEMIC_LIST_KEY,
  SITE_NEWS_LIST_KEY,
  SITE_NOTICE_LIST_KEY,
} from "../../config/keys.js";
import { ensureActionLogin } from "../../login/action.js";
import { HOUR } from "../../utils/constant.js";
import {
  FILTERED_SOURCES,
  WidgetSize,
  WidgetStatus,
  getSize,
} from "../utils.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const getKey = (type: InfoType): string =>
  type === "academic"
    ? SITE_ACADEMIC_LIST_KEY
    : type === "news"
    ? SITE_NEWS_LIST_KEY
    : SITE_NOTICE_LIST_KEY;

$Component({
  properties: {
    type: {
      type: String as PropType<
        | "官网通知 (小)"
        | "官网通知"
        | "官网通知 (大)"
        | "官网新闻 (小)"
        | "官网新闻"
        | "官网新闻 (大)"
        | "学术会议 (小)"
        | "学术会议"
        | "学术会议 (大)"
      >,
      default: "官网通知",
    },
  },

  data: {
    size: <WidgetSize>"medium",
    noticeType: <InfoType>"notice",
    status: <WidgetStatus>"loading",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;
      const noticeType = type.includes("学术")
        ? "academic"
        : type.includes("新闻")
        ? "news"
        : "notice";
      const size = getSize(type);

      this.setData(
        {
          header:
            noticeType === "academic"
              ? "学术会议"
              : noticeType === "news"
              ? "官网新闻"
              : "官网通知",
          noticeType,
          size,
        },
        () => {
          const data = get<InfoItem[]>(getKey(noticeType));

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
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getInfoList("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getInfoList(status: "check" | "login" | "validate" = "check") {
      const { noticeType, size } = this.data;

      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await (useOnlineService("info-list")
            ? getOnlineInfoList
            : getInfoList)({
            type: noticeType,
          });

          if (result.success) {
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
            set(getKey(noticeType), data, HOUR);
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
      { info: InfoItem }
    >) {
      const { noticeType } = this.data;
      const { title, url } = currentTarget.dataset.info;

      return this.$go(
        `info-detail?title=${title}&type=${noticeType}&url=${url}`,
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

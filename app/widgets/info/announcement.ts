import { $Component, PropType, get, set } from "@mptool/all";

import type { AnnouncementInfoItem } from "./api/announcement.js";
import {
  getAnnouncementList,
  getOnlineAnnouncementList,
} from "./api/announcement.js";
import { showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { SITE_ANNOUNCEMENT_LIST_KEY } from "../../config/keys.js";
import { ensureActionLogin } from "../../login/action.js";
import { HOUR } from "../../utils/constant.js";
import {
  FILTERED_SOURCES,
  WidgetSize,
  WidgetStatus,
  getSize,
} from "../utils.js";

const { globalData, useOnlineService } = getApp<AppOption>();

$Component({
  properties: {
    type: {
      type: String as PropType<"通知公告 (小)" | "通知公告" | "通知公告 (大)">,
      default: "通知公告",
    },
  },

  data: {
    size: <WidgetSize>"medium",
    status: <WidgetStatus>"loading",
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      const size = getSize(type);

      this.setData({ size }, () => {
        const data = get<AnnouncementInfoItem[]>(SITE_ANNOUNCEMENT_LIST_KEY);

        if (data)
          this.setData({
            status: "success",
            data: size === "large" ? data : data.slice(0, 5),
          });
        else this.getAnnouncementList("validate");
      });
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getAnnouncementList("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getAnnouncementList(
      status: "check" | "login" | "validate" = "check",
    ) {
      const { size } = this.data;

      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await (useOnlineService("announcement-list")
            ? getOnlineAnnouncementList
            : getAnnouncementList)();

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
            set(SITE_ANNOUNCEMENT_LIST_KEY, data, HOUR);
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
      { info: AnnouncementInfoItem }
    >) {
      const { title, url } = currentTarget.dataset.info;

      return this.$go(`announcement-detail?title=${title}&url=${url}`);
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getAnnouncementList();
    },

    retry() {
      this.setData({ status: "loading" });
      this.getAnnouncementList("login");
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

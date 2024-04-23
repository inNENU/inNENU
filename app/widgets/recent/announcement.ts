import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { HOUR } from "../../config/index.js";
import { SITE_ANNOUNCEMENT_LIST_KEY } from "../../config/keys.js";
import type { AnnouncementInfoItem } from "../../service/index.js";
import {
  ensureActionLogin,
  getAnnouncementList,
  getOnlineAnnouncementList,
} from "../../service/index.js";
import { user } from "../../state/user.js";
import type { WidgetSize, WidgetStatus } from "../utils.js";
import { FILTERED_SOURCES, getSize } from "../utils.js";

const { useOnlineService } = getApp<AppOption>();

$Component({
  properties: {
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
      if (user.account) {
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

      if (user.account) {
        const err = await ensureActionLogin(user.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await (
            useOnlineService("announcement-list")
              ? getOnlineAnnouncementList
              : getAnnouncementList
          )();

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

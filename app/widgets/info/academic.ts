import { $Component, PropType, get, set } from "@mptool/all";

import type { AcademicInfoItem } from "./api/academic.js";
import { getAcademicList, getOnlineAcademicList } from "./api/academic.js";
import { showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { SITE_ACADEMIC_LIST_KEY } from "../../config/keys.js";
import { ensureActionLogin } from "../../login/action.js";
import { HOUR } from "../../utils/constant.js";
import { WidgetSize, WidgetStatus, getSize } from "../utils.js";

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
        const data = get<AcademicInfoItem[]>(SITE_ACADEMIC_LIST_KEY);

        if (data)
          this.setData({
            status: "success",
            data: size === "large" ? data : data.slice(0, 5),
          });
        else this.getAcademicList("validate");
      });
    },
  },

  pageLifetimes: {
    show() {
      if (globalData.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getAcademicList("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getAcademicList(status: "check" | "login" | "validate" = "check") {
      const { size } = this.data;

      if (globalData.account) {
        const err = await ensureActionLogin(globalData.account, status);

        if (err) {
          showToast(err.msg);

          return this.setData({ status: "error" });
        }

        try {
          const result = await (useOnlineService("academic-list")
            ? getOnlineAcademicList
            : getAcademicList)();

          if (result.success) {
            const { data } = result;

            this.setData({
              status: "success",
              data: size === "large" ? data : data.slice(0, 5),
            });
            set(SITE_ACADEMIC_LIST_KEY, data, HOUR);
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
      { info: AcademicInfoItem }
    >) {
      const { subject, url } = currentTarget.dataset.info;

      return this.$go(`academic-detail?title=${subject}&url=${url}`);
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getAcademicList();
    },

    retry() {
      this.setData({ status: "loading" });
      this.getAcademicList("login");
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

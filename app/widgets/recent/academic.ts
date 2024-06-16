import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { showToast } from "../../api/index.js";
import { HOUR, SITE_ACADEMIC_LIST_KEY } from "../../config/index.js";
import type { OfficialAcademicInfoItem } from "../../service/index.js";
import {
  ensureActionLogin,
  getOfficialAcademicList,
} from "../../service/index.js";
import { user } from "../../state/index.js";
import type { WidgetSize, WidgetStatus } from "../utils.js";
import { getSize } from "../utils.js";

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
        const data = get<OfficialAcademicInfoItem[]>(SITE_ACADEMIC_LIST_KEY);

        if (data)
          this.setData({
            status: "success",
            data: size === "large" ? data : data.slice(0, 5),
          });
        else this.getOfficialAcademicList("validate");
      });
    },
  },

  pageLifetimes: {
    show() {
      if (user.account) {
        if (this.data.status === "login") {
          this.setData({ status: "loading" });
          this.getOfficialAcademicList("validate");
        }
      } else this.setData({ status: "login" });
    },
  },

  methods: {
    async getOfficialAcademicList(
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
          const result = await getOfficialAcademicList();

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
      { info: OfficialAcademicInfoItem }
    >) {
      const { subject, url } = currentTarget.dataset.info;

      return this.$go(`official-academic-detail?title=${subject}&url=${url}`);
    },

    refresh() {
      this.setData({ status: "loading" });
      this.getOfficialAcademicList();
    },

    retry() {
      this.setData({ status: "loading" });
      this.getOfficialAcademicList("login");
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

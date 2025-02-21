import type { PropType } from "@mptool/all";
import { $Component, get, set } from "@mptool/all";

import { HOUR, SITE_ACADEMIC_LIST_KEY } from "../../config/index.js";
import type { OfficialAcademicInfoItem } from "../../service/index.js";
import { getOfficialAcademicList } from "../../service/index.js";
import type { WidgetSize, WidgetStatus } from "../utils.js";
import { getSize } from "../utils.js";

$Component({
  props: {
    type: {
      type: String as PropType<"学术预告 (小)" | "学术预告" | "学术预告 (大)">,
      default: "学术预告",
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
      const data = get<OfficialAcademicInfoItem[]>(SITE_ACADEMIC_LIST_KEY);

      this.setData({ size });
      if (data)
        this.setData({
          status: "success",
          data: size === "large" ? data : data.slice(0, 5),
        });
      else this.getOfficialAcademicList();
    },
  },

  methods: {
    async getOfficialAcademicList() {
      const { size } = this.data;

      const result = await getOfficialAcademicList();

      if (!result.success) {
        this.setData({ status: "error" });

        return;
      }

      const { data } = result;

      this.setData({
        status: "success",
        data: size === "large" ? data : data.slice(0, 5),
      });
      set(SITE_ACADEMIC_LIST_KEY, data, HOUR);
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
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

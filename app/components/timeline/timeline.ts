import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import { info } from "../../state/info.js";

export interface TimeLineItem {
  /** 时间线项目标题 */
  title: string;
  /** 时间线项目文字 */
  text: string;
  /** 时间线项目图标地址 */
  icon?: string;
  /** 时间线指示点颜色 */
  color: "green" | "red" | "blue";
  /** 跳转详情的名称 */
  path?: string;
  /** class 名称 */
  class?: string;
}

$Component({
  properties: {
    /** 时间线配置 */
    config: {
      type: Array as PropType<TimeLineItem[]>,
      default: [],
    },
  },

  data: {
    /** 是否使用交错布局 */
    alternate: false,
  },

  pageLifetimes: {
    resize({ size }) {
      this.setData({ alternate: size.windowWidth >= 750 });
    },
  },

  lifetimes: {
    attached() {
      const { selectable } = info;

      this.setData({ selectable });
    },
  },

  methods: {
    active({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >): void {
      const { path = "" } = this.data.config[currentTarget.dataset.index];

      this.triggerEvent("active", { path });
    },
  },
});

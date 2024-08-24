import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { PopupConfig } from "./typings.js";
import { getWindowInfo } from "../../api/index.js";
import { info } from "../../state/index.js";

$Component({
  props: {
    config: {
      type: Object as PropType<PopupConfig>,
      required: true,
    },
    // 是否展示对话框
    show: {
      type: Boolean,
      default: false,
    },
    paddingInline: {
      type: Number,
      default: 24,
    },
    dark: {
      type: Boolean,
      default: false,
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        renderer: this.renderer,
        darkmode: this.data.dark ?? info.darkmode,
      });
      this.updateLayout();
    },
  },

  pageLifetimes: {
    resize() {
      this.updateLayout();
    },
  },

  methods: {
    updateLayout() {
      const { windowHeight, safeArea } = getWindowInfo();

      this.setData({
        paddingBottom: Math.max(windowHeight - safeArea.bottom, 24),
      });
    },
    // 用户确认
    confirm(): void {
      this.triggerEvent("confirm");
    },
    // 用户取消
    cancel(): void {
      this.triggerEvent("cancel");
    },
    // 用户点击关闭按钮
    closeDialog(): void {
      this.triggerEvent("close");
    },
    // 用户点击更多按钮
    more(): void {
      this.triggerEvent("more");
    },
  },

  externalClasses: ["content-class"],
});

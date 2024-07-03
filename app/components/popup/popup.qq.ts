import { $Component } from "@mptool/all";

import { getWindowInfo } from "../../api/index.js";
import { info } from "../../state/index.js";

$Component({
  props: {
    config: Object,
    // 是否展示对话框
    show: {
      type: Boolean,
      default: false,
    },
    paddingInline: {
      type: Number,
      default: 24,
    },
  },

  lifetimes: {
    attached() {
      this.setData({ darkmode: info.darkmode });
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

      // TODO: issues in qq where safeArea is not defined
      this.setData({
        paddingBottom: safeArea?.bottom
          ? Math.max(windowHeight - safeArea.bottom, 24)
          : 24,
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

  options: {
    styleIsolation: "apply-shared",
  },
});

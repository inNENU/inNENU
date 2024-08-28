import { $Component } from "@mptool/all";

import { appInfo, windowInfo } from "../../state/index.js";

$Component({
  props: {
    icon: String,
    action: String,
  },

  data: {
    statusBarHeight: windowInfo.statusBarHeight,
  },

  lifetimes: {
    attached() {
      this.setImageLink(appInfo.darkmode);
      wx.onThemeChange?.(this.onThemeChange);
    },

    detached() {
      wx.offThemeChange?.(this.onThemeChange);
    },
  },

  methods: {
    setImageLink(isDarkMode: boolean) {
      this.setData({
        src: `./icon/${getCurrentPages().length === 1 ? "home" : "back"}-${isDarkMode ? "white" : "black"}.svg`,
      });
    },

    onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeListenerResult) {
      this.setImageLink(theme === "dark");
    },

    onTap() {
      if (this.data.action) {
        this.$call(this.data.action);
      } else {
        this.$back();
      }
    },
  },

  externalClasses: ["button-class"],
});

import { $Component } from "@mptool/all";

import { info } from "../../state/index.js";

$Component({
  lifetimes: {
    attached() {
      this.setData({
        statusBarHeight: info.statusBarHeight,
      });
      this.setImageLink(info.darkmode);
      wx.onThemeChange?.(this.onThemeChange);
    },

    detached() {
      wx.offThemeChange?.(this.onThemeChange);
    },
  },

  methods: {
    setImageLink(isDarkMode: boolean) {
      this.setData({
        src: `/icon/${getCurrentPages().length === 1 ? "home" : "back"}${isDarkMode ? "-white" : ""}.svg`,
      });
    },

    onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeListenerResult) {
      this.setImageLink(theme === "dark");
    },
  },
});

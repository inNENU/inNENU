import { $Component, get, set } from "@mptool/all";

import { MONTH } from "../../config/index.js";
import { appInfo, windowInfo } from "../../state/index.js";

const KEY = "add-miniprogram-hint";

$Component({
  props: {
    /** 提示文字 */
    text: {
      type: String,
      default: "点击「添加小程序」，下次访问更便捷",
    },
    /** 关闭延时，单位 ms，默认 5000 */
    duration: { type: Number, default: 5000 },
  },

  data: {
    statusBarHeight: windowInfo.statusBarHeight,
    display: true,
  },

  lifetimes: {
    attached() {
      this.setData({ darkmode: appInfo.darkmode });
      wx.onThemeChange?.(this.onThemeChange);
    },

    ready() {
      if (wx.checkIsAddedToMyMiniProgram) {
        wx.checkIsAddedToMyMiniProgram({
          success: ({ added }) => {
            this.setData({
              display: !added,
            });
          },
        });
      } else {
        // 判断是否已经显示过
        const cache = get<boolean>(KEY);

        if (!cache) {
          // 没显示过，则进行展示
          this.setData({ display: true });

          // 关闭时间
          setTimeout(() => {
            this.setData({ display: false });
          }, this.data.duration);
        }
      }
    },

    detached() {
      wx.offThemeChange?.(this.onThemeChange);
    },
  },

  methods: {
    onThemeChange({ theme }: WechatMiniprogram.OnThemeChangeListenerResult) {
      this.setData({ darkmode: theme === "dark" });
    },

    addToMyApps() {
      this.close();
    },

    /** 关闭显示 */
    close(): void {
      this.setData({ display: false });

      // thirty days
      set(KEY, true, MONTH);
    },
  },
});

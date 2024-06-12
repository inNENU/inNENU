import { get, set } from "@mptool/all";

import { MONTH } from "../../config/index.js";
import { info } from "../../state/index.js";

const KEY = "add-miniprogram-hint";

Component({
  properties: {
    /** 提示文字 */
    text: { type: String, value: "点击「添加小程序」，下次访问更便捷" },
    /** 关闭延时，单位 ms，默认 5000 */
    duration: { type: Number, value: 5000 },
  },

  data: {
    display: true,
  },

  lifetimes: {
    attached() {
      const { darkmode, statusBarHeight } = info;

      this.setData({ darkmode, statusBarHeight });
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
      } else if (wx.isAddedToMyApps) {
        wx.isAddedToMyApps({
          success: ({ isAdded }) => {
            this.setData({
              display: !isAdded,
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
          }, this.properties.duration);
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
      if (wx.applyAddToMyApps) wx.applyAddToMyApps();
      else this.close();
    },

    /** 关闭显示 */
    close(): void {
      this.setData({ display: false });

      // thirty days
      set(KEY, true, MONTH);
    },
  },
});

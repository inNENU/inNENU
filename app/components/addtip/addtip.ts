import { get, set } from "@mptool/all";

import { type AppOption } from "../../app.js";
import { MONTH } from "../../utils/constant.js";

const { globalData } = getApp<AppOption>();

const KEY = "add-miniprogram-hint";

Component({
  properties: {
    /** 提示文字 */
    text: { type: String, value: "点击「添加小程序」，下次访问更便捷" },
    /** 关闭延时，单位 ms，默认 5000 */
    duration: { type: Number, value: 5000 },
  },

  data: {
    display: false,
    statusBarHeight: globalData.info.statusBarHeight,
  },

  lifetimes: {
    ready() {
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
    },
  },

  methods: {
    /** 关闭显示 */
    close(): void {
      this.setData({ display: false });

      // thirty days
      set(KEY, true, MONTH);
    },
  },
});

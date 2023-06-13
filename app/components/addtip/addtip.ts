import { type AppOption } from "../../app.js";

const { globalData } = getApp<AppOption>();

Component({
  properties: {
    /** 提示文字 */
    text: { type: String, value: "点击「添加小程序」，下次访问更便捷" },
    /** 关闭延时，单位 ms，默认 5000 */
    duration: { type: Number, value: 5000 },
  },

  data: {
    showTop: false,
    showModal: false,
    statusBarHeight: globalData.info.statusBarHeight,
  },

  lifetimes: {
    ready() {
      // 判断是否已经显示过
      const cache = wx.getStorageSync<number | undefined>("add-tip");

      if (!cache) {
        // 没显示过，则进行展示
        this.setData({ showTop: true });

        // 关闭时间
        setTimeout(() => {
          this.setData({ showTop: false });
        }, this.data.duration);
      }
    },
  },

  methods: {
    /** 关闭显示 */
    close(): void {
      this.setData({ showTop: false });

      wx.setStorage({ key: "add-tip", data: new Date().getTime() });
    },
  },
});

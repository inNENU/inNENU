import $register = require("wxpage");

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
  /** class名称 */
  class?: string;
}

$register.C({
  properties: {
    /** 时间线配置 */
    config: Array,
  },

  data: {
    /** 是否使用交错布局 */
    alternate: false,
    timeList: [] as TimeLineItem[],
  },

  lifetimes: {
    attached(): void {
      wx.onWindowResize(this.updateTimeline);
    },

    detached(): void {
      wx.offWindowResize(this.updateTimeline);
    },
  },

  methods: {
    active({ currentTarget }: WXEvent.Touch): void {
      const path = this.data.config[currentTarget.dataset.index]
        .path as TimeLineItem["path"];

      if (path) this.triggerEvent("active", { path });
    },

    /** 更新时间线视图 */
    updateTimeline(): void {
      const res = wx.getSystemInfoSync();

      this.setData({ alternate: res.windowWidth >= 750 });
    },
  },
});

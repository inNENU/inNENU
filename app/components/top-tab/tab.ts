import { info } from "../../state/index.js";

Component({
  properties: {
    navList: { type: Array, value: [] },
    /** 是否立即更改还是等动画完成之后再进行更改 */
    immediate: { type: Boolean, value: true },
    height: { type: Number, default: 200 },
  },

  data: {
    curNavItem: [],
    barleft: 0,
    current: 0,
    currentSwipe: 0,
  },

  methods: {
    changeTab({ currentTarget }: WechatMiniprogram.TouchEvent): void {
      this.setData({ current: Number(currentTarget.dataset.index) });
    },

    change({ detail }: WechatMiniprogram.SwiperChange): void {
      if (this.properties.immediate) this.setData({ current: detail.current });
    },

    // 设置指示条动画
    transition({ detail }: WechatMiniprogram.SwiperTransition): void {
      this.setData({
        barleft:
          (detail.dx + info.windowWidth * this.data.currentSwipe) /
          this.data.navList.length,
      });
    },

    aminationFinish({
      detail: { current },
    }: WechatMiniprogram.SwiperAnimationFinish): void {
      this.setData({ currentSwipe: current });
      if (!this.data.immediate) this.setData({ current });
    },
  },

  observers: {
    current(index): void {
      this.setData({ activeTab: index === 0 ? 0 : index - 1 });
    },
  },

  options: {
    multipleSlots: true,
  },

  externalClasses: ["tab-class"],
});

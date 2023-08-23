Component({
  properties: { config: Object },

  data: {
    /** 当前显示的图片序号 */
    current: 0,
  },

  methods: {
    change(event: WechatMiniprogram.SwiperChange): void {
      this.setData({ current: event.detail.current });

      this.triggerEvent("change", event);
    },

    animation(event: WechatMiniprogram.SwiperAnimationFinish): void {
      this.triggerEvent("animation", event);
    },
  },
});

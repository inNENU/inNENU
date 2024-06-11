import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { CarouselComponentOptions } from "../../../typings/index.js";

$Component({
  properties: {
    config: {
      type: Object as PropType<CarouselComponentOptions>,
      required: true,
    },
  },

  data: {
    /** 当前显示的图片序号 */
    current: 0,
  },

  lifetimes: {
    attached() {
      this.setPassiveEvent?.({
        wheel: false,
      });
    },
  },

  methods: {
    change(event: WechatMiniprogram.SwiperChange): void {
      this.setData({ current: event.detail.current });

      this.triggerEvent("change", event);
    },

    animationFinish(event: WechatMiniprogram.SwiperAnimationFinish): void {
      this.triggerEvent("animation", event);
    },
  },
});

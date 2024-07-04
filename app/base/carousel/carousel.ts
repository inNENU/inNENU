import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { CarouselComponentOptions } from "../../../typings/index.js";

$Component({
  props: {
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
      // FIXME: Now skyline has bugs in setPassiveEvent
      if (this.renderer !== "skyline") this.setPassiveEvent?.({ wheel: false });
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

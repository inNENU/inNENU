import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { CarouselComponentOptions } from "../../../typings/index.js";
import { getAssetLink } from "../../utils/index.js";

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
      this.setData({
        images: this.data.config.images.map(getAssetLink),
      });
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

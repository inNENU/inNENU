import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { TitleComponentOptions } from "../../../typings/index.js";
import { info, windowInfo } from "../../state/index.js";
import { getSizeClass } from "../../utils/size.js";

$Component({
  props: {
    /** 段落配置 */
    config: {
      type: Object as PropType<TitleComponentOptions>,
      required: true,
    },
  },

  methods: {
    onResize({ size }: WechatMiniprogram.OnWindowResizeListenerResult) {
      this.setData({
        size: getSizeClass(size.windowWidth),
      });
    },
  },

  lifetimes: {
    created() {
      this.onResize = this.onResize.bind(this);
    },
    attached() {
      const { selectable } = info;

      this.setData({
        selectable,
        // NOTE: Skyline does not support media queries
        size: getSizeClass(windowInfo.windowWidth),
      });
      wx.onWindowResize(this.onResize);
    },
    detached() {
      wx.offWindowResize(this.onResize);
    },
  },
});

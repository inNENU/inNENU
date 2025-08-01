import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { TitleComponentOptions } from "../../../typings/index.js";
import { info, windowInfo } from "../../state/index.js";

$Component({
  props: {
    /** 段落配置 */
    config: {
      type: Object as PropType<TitleComponentOptions>,
      required: true,
    },
  },

  lifetimes: {
    attached() {
      const { selectable } = info;

      this.setData({
        selectable,
        // NOTE: Skyline does not support media queries
        wideScreen: windowInfo.windowWidth >= 768,
      });
    },
  },
});

import { $Component, type PropType } from "@mptool/enhance";

import { type TextComponentOptions } from "../../../../typings";
import { type AppOption } from "../../../app";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    /** 段落配置 */
    config: {
      type: Object as PropType<TextComponentOptions>,
      required: true,
    },
  },

  lifetimes: {
    attached() {
      const { selectable } = globalData;

      this.setData({ selectable });
    },
  },
});

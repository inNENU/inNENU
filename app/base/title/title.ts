import { $Component, type PropType } from "@mptool/all";

import { type TitleComponentOptions } from "../../../typings/index.js";
import { type AppOption } from "../../app.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    /** 段落配置 */
    config: {
      type: Object as PropType<TitleComponentOptions>,
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

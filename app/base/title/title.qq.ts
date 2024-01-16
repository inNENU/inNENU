import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { TitleComponentOptions } from "../../../typings/index.js";
import { info } from "../../state/info.js";

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
      const { selectable } = info;

      this.setData({ selectable });
    },
  },

  options: {
    styleIsolation: "shared",
  },
});

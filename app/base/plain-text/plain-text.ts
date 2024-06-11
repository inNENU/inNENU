import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { TextComponentOptions } from "../../../typings/index.js";
import { info } from "../../state/index.js";

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
      const { selectable } = info;

      this.setData({ selectable });
    },
  },

  // Note: for QQ only
  options: {
    styleIsolation: "shared",
  },
});

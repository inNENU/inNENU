import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { TableComponentOptions } from "../../../typings/index.js";
import { info } from "../../state/index.js";

$Component({
  props: {
    /** 表格配置 */
    config: {
      type: Object as PropType<TableComponentOptions>,
      required: true,
    },
  },

  lifetimes: {
    attached() {
      const { selectable } = info;

      this.setData({ selectable });
    },
  },
});

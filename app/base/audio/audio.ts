import { $Component, type PropType } from "@mptool/enhance";

import { type AudioComponentOptions } from "../../../typings/index.js";

$Component({
  properties: {
    /** 媒体组件配置 */
    config: {
      type: Object as PropType<AudioComponentOptions>,
      required: true,
    },
  },
});
import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { TextComponentOptions } from "../../../typings/index.js";
import { info } from "../../state/index.js";
import { route } from "../../utils/index.js";

$Component({
  props: {
    /** 段落配置 */
    config: {
      type: Object as PropType<TextComponentOptions>,
      required: true,
    },

    /** 引用标题 */
    referer: {
      type: String,
      default: "",
    },
  },

  lifetimes: {
    attached() {
      this.setData({ selectable: info.selectable });
    },
  },

  methods: {
    onTap() {
      const { config, referer } = this.data;

      route(config, referer);
    },
  },
});

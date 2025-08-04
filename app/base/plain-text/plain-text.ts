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
    referrer: {
      type: String,
      default: "",
    },

    /** 是否在大标题后 */
    afterTitle: Boolean,
  },

  lifetimes: {
    attached() {
      this.setData({ selectable: info.selectable, renderer: this.renderer });
    },
  },

  methods: {
    onTap() {
      const { config, referrer } = this.data;

      route(config, referrer);
    },
  },
});

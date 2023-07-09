import { $Component, type PropType } from "@mptool/enhance";

import { type FooterComponentOptions } from "../../../typings/index.js";

$Component({
  properties: {
    /** 页脚配置 */
    config: {
      type: Object as PropType<FooterComponentOptions>,
      required: true,
    },
  },

  methods: {
    copyCite({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const site = this.data.config.cite![currentTarget.dataset.index];

      this.$go(`web?url=${site}`);
    },
  },
});

import type { PropType } from "@mptool/all";
import { $Component, logger, writeClipboard } from "@mptool/all";

import type { ActionComponentOptions } from "../../../typings/index.js";

$Component({
  props: {
    /** 配置 */
    config: {
      type: Object as PropType<ActionComponentOptions>,
      required: true,
    },
  },

  data: {
    type: "text",
    content: "",
  },

  methods: {
    async copy(): Promise<void> {
      const { content } = this.data.config;

      await writeClipboard(content);
      logger.debug(`Copied '${content}'`);
    },

    link(): void {
      const { content } = this.data.config;

      wx.miniapp.openUrl({ url: content });
    },
  },

  observers: {
    "config.content"(value: string) {
      const isLink = /^https?:\/\//.test(value);

      this.setData({
        type: isLink ? "link" : "text",
        content: isLink ? value.replace(/^https?:\/\//, "") : value,
      });
    },
  },
});

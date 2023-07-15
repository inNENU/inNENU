import { $Component, type PropType } from "@mptool/all";

import { type ActionComponentOptions } from "../../../typings/index.js";

$Component({
  properties: {
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
    copy(): void {
      const { content } = this.data.config;

      wx.setClipboardData({
        data: content,
        success: () => console.log(`Copied '${content}'`),
      });
    },

    link(): void {
      const { content } = this.data.config;

      this.$go(`web?url=${encodeURI(content)}`);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.content"(value: string) {
      const isLink = value.match(/^https?:\/\//);

      this.setData({
        type: isLink ? "link" : "text",
        content: isLink ? value.replace(/^https?:\/\//, "") : value,
      });
    },
  },
});

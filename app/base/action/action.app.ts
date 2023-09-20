import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { ActionComponentOptions } from "../../../typings/index.js";
import { setClipboard } from "../../api/index.js";

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

      setClipboard(content).then(() => {
        console.log(`Copied '${content}'`);
      });
    },

    link(): void {
      const { content } = this.data.config;

      wx.miniapp.openUrl({ url: content });
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

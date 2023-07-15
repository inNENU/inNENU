import { $Component, type PropType } from "@mptool/all";

import { type ActionComponentOptions } from "../../../typings/index.js";
import { showModal } from "../../api/ui.js";

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

      wx.setClipboardData({
        data: content,
        success: () => {
          showModal("功能受限", "小程序无法直接打开网页，链接已复制至剪切板");
          console.log(`Copied '${content}'`);
        },
      });
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

  options: {
    styleIsolation: "shared",
  },
});

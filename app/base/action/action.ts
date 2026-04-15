import type { PropType } from "@mptool/all";
import { $Component, logger, showModal, writeClipboard } from "@mptool/all";

import type { ActionComponentOptions } from "../../../typings/index.js";

$Component({
  props: {
    /** 配置 */
    config: {
      type: Object as PropType<ActionComponentOptions>,
      required: true,
    },

    /** 是否在大标题后 */
    afterTitle: Boolean,
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

    async link(): Promise<void> {
      const { content } = this.data.config;

      await writeClipboard(content);
      showModal("功能受限", "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。");
      logger.debug(`Copied '${content}'`);
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

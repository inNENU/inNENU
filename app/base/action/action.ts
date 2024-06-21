import type { PropType } from "@mptool/all";
import { $Component, logger } from "@mptool/all";

import type { ActionComponentOptions } from "../../../typings/index.js";
import { copyContent, showModal } from "../../api/index.js";

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
    copy(): void {
      const { content } = this.data.config;

      copyContent(content).then(() => {
        logger.debug(`Copied '${content}'`);
      });
    },

    link(): void {
      const { content } = this.data.config;

      copyContent(content).then(() => {
        showModal(
          "功能受限",
          "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
        );
        logger.debug(`Copied '${content}'`);
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

  // NOTE: For QQ only
  options: {
    styleIsolation: "shared",
  },
});

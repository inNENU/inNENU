import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { FooterComponentOptions } from "../../../typings/index.js";
import { setClipboard, showModal } from "../../api/index.js";
import { description } from "../../config/index.js";

$Component({
  properties: {
    /** 页脚配置 */
    config: {
      type: Object as PropType<FooterComponentOptions>,
      required: true,
    },
  },

  data: { description },

  methods: {
    copyCite({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { index: number }
    >) {
      const url = this.data.config.cite![currentTarget.dataset.index];

      setClipboard(url).then(() => {
        showModal(
          "无法直接打开",
          "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
        );
      });
    },
  },
});

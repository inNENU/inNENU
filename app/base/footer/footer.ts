import { $Component, type PropType } from "@mptool/enhance";

import { type FooterComponentOptions } from "../../../typings/index.js";
import { showModal } from "../../api/ui.js";

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
      wx.setClipboardData({
        data: this.data.config.cite![currentTarget.dataset.index],
        success: () => {
          showModal(
            "无法直接打开",
            "小程序无法直接打开网页，链接地址已复制至剪切板。请打开浏览器粘贴查看"
          );
        },
      });
    },
  },
});

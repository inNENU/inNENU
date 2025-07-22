import type { PropType } from "@mptool/all";
import { $Component, env, showModal, writeClipboard } from "@mptool/all";

import type { FooterComponentOptions } from "../../../typings/index.js";
import { description } from "../../config/index.js";

$Component({
  props: {
    /** 页脚配置 */
    config: {
      type: Object as PropType<FooterComponentOptions>,
      required: true,
    },
  },

  data: { description },

  lifetimes: {
    attached() {
      this.setData({
        copyright: `${description}\nCopyright © 2017-${new Date().getFullYear()} Mr.Hope`,
      });
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
      const url = this.data.config.cite![currentTarget.dataset.index];

      if (env === "donut") {
        wx.miniapp.openUrl({ url });
      } else {
        writeClipboard(url).then(() => {
          showModal(
            "无法直接打开",
            "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
          );
        });
      }
    },
  },
});

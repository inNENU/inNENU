import { $Component, type PropType, readFile } from "@mptool/all";

import { type CardComponentOptions } from "../../../typings/index.js";
import { showModal } from "../../api/index.js";

$Component({
  properties: {
    config: {
      type: Object as PropType<CardComponentOptions>,
      required: true,
    },
  },

  methods: {
    /** 点击卡片触发的操作 */
    tap(): void {
      const { config } = this.data;

      if ("options" in config) wx.navigateToMiniProgram(config.options);
      // 页面路径
      else if (!config.url.match(/^https?:\/\//)) this.$go(config.url);
      // 无法跳转，复制链接到剪切板
      else
        wx.setClipboardData({
          data: config.url,
          success: () => {
            showModal(
              "无法直接打开",
              "小程序无法直接打开网页，链接地址已复制至剪切板。请打开浏览器粘贴查看",
            );
          },
        });
    },

    setLogo(value?: string) {
      const logo = value || this.data.config.logo;

      // 设置图标
      if (logo && !logo.includes("/"))
        this.setData({
          base64Logo: readFile(`icon/${logo}`) || "",
        });
    },
  },

  lifetimes: {
    attached() {
      this.setLogo = this.setLogo.bind(this);
      this.$on("inited", this.setLogo);
    },

    detached() {
      this.$off("inited", this.setLogo);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.logo"(value: string): void {
      this.setLogo(value);
    },
  },
});

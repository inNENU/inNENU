import { $Component, type PropType } from "@mptool/enhance";
import { readFile } from "@mptool/file";

import { type CardComponentOptions } from "../../../../typings";

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
      // 网页
      else this.$go(`web?url=${config.url}&title=${config.title}`);
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

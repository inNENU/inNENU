import type { PropType } from "@mptool/all";
import { $Component, readFile } from "@mptool/all";

import type { CardComponentOptions } from "../../../typings/index.js";

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
      else if ("path" in config) this.$go(`info?path=${config.path}`);
      // 页面路径
      else if (!config.url.match(/^https?:\/\//)) this.$go(config.url);
      // 打开浏览器或 App
      else wx.miniapp.openUrl({ url: config.url });
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

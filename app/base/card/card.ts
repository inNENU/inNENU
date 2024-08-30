import type { PropType } from "@mptool/all";
import { $Component, readFile } from "@mptool/all";

import type { CardComponentOptions } from "../../../typings/index.js";
import { getPath, navigate } from "../../utils/index.js";

$Component({
  props: {
    /** 组件配置 */
    config: {
      type: Object as PropType<CardComponentOptions>,
      required: true,
    },

    /** 引用标题 */
    referer: {
      type: String,
      default: "",
    },
  },

  data: {
    cover: "",
    logo: "",
  },

  methods: {
    setLogo(value?: string) {
      const logo = value || this.data.config.logo;

      // 设置图标
      if (logo && !logo.includes("/"))
        this.setData({
          base64Logo: readFile(`icon/${logo}`) || "",
        });
    },

    /** 点击卡片触发的操作 */
    onTap(): void {
      const { config, referer } = this.data;

      navigate(config, referer);
    },
  },

  lifetimes: {
    created() {
      this.setLogo = this.setLogo.bind(this);
    },
    attached() {
      const { cover } = this.data.config;

      this.setData({
        cover: getPath(cover),
      });
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

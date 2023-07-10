import { $Component, type PropType } from "@mptool/enhance";
import { readFile } from "@mptool/file";

import {
  type GridComponentItemOptions,
  type GridComponentOptions,
} from "../../../typings/index.js";

$Component({
  properties: {
    /** 网格组件配置 */
    config: {
      type: Object as PropType<GridComponentOptions>,
      required: true,
    },
  },

  methods: {
    // 设置图标
    setLogo(items?: GridComponentItemOptions[]) {
      this.setData({
        icons: (items || this.data.config.items || []).map((item) =>
          item.icon && !item.icon.includes("/")
            ? readFile(`icon/${item.icon}`) || ""
            : "",
        ),
      });
    },
  },

  lifetimes: {
    created() {
      this.setLogo = this.setLogo.bind(this);
    },
    attached() {
      this.$on("inited", this.setLogo);
    },
    detached() {
      this.$off("inited", this.setLogo);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.items"(value: GridComponentItemOptions[]): void {
      this.setLogo(value);
    },
  },
});

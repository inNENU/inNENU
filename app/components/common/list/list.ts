import { $Component, type PropType } from "@mptool/enhance";
import { readFile } from "@mptool/file";

import {
  type ListComponentConfig,
  type ListComponentItemConfig,
} from "../../../../typings/index.js";
import { type AppOption } from "../../../app.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    /** 普通列表配置 */
    config: {
      type: Object as PropType<ListComponentConfig>,
      required: true,
    },
  },

  methods: {
    // 设置图标
    setLogo(items?: ListComponentItemConfig[]) {
      this.setData({
        icons: (items || this.data.config.items || []).map((item) =>
          item.icon && !item.icon.includes("/")
            ? readFile(`icon/${item.icon}`) || ""
            : ""
        ),
      });
    },
  },

  lifetimes: {
    attached() {
      const { selectable } = globalData;

      this.setData({ selectable });
      this.setLogo = this.setLogo.bind(this);
      this.$on("inited", this.setLogo);
    },
    detached() {
      this.$off("inited", this.setLogo);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.items"(value: ListComponentItemConfig[]): void {
      this.setLogo(value);
    },
  },
});

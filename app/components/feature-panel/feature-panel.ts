import type { PropType } from "@mptool/all";
import { $Component, get, readFile } from "@mptool/all";

import type {
  GridComponentItemOptions,
  GridComponentOptions,
} from "../../../typings/index.js";

$Component({
  properties: {
    /** 网格组件配置 */
    config: {
      type: Object as PropType<GridComponentOptions>,
      required: true,
    },
  },

  data: {
    flat: get<boolean>("flat-feature-panel") ?? true,
  },

  lifetimes: {
    created() {
      this.setLogo = this.setLogo.bind(this);
      this.setFlat = this.setFlat.bind(this);
    },
    attached() {
      this.setData({ flat: get<boolean>("flat-feature-panel") ?? true });
      this.$on("feature-panel", this.setFlat);
      this.$on("inited", this.setLogo);
    },
    detached() {
      this.$off("feature-panel", this.setFlat);
      this.$off("inited", this.setLogo);
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
    setFlat(flat: boolean) {
      this.setData({ flat });
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.items"(value: GridComponentItemOptions[]): void {
      this.setLogo(value);
    },
  },
});

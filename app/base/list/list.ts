import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type {
  ListComponentItemOptions,
  ListComponentOptions,
} from "../../../typings/index.js";
import { info } from "../../state/index.js";
import { getIconLink, route } from "../../utils/index.js";

$Component({
  props: {
    /** 普通列表配置 */
    config: {
      type: Object as PropType<ListComponentOptions>,
      required: true,
    },

    /** 引用标题 */
    referrer: {
      type: String,
      default: "",
    },

    /** 是否在大标题后 */
    afterTitle: Boolean,
  },

  methods: {
    // 设置图标
    setLogo(items?: ListComponentItemOptions[]) {
      this.setData({
        icons: (items || this.data.config.items || []).map(({ icon }) =>
          getIconLink(icon),
        ),
      });
    },

    onTap({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { item: ListComponentItemOptions }
    >) {
      const { referrer } = this.data;
      const { item } = currentTarget.dataset;

      route(item, referrer);
    },
  },

  lifetimes: {
    created() {
      this.setLogo = this.setLogo.bind(this);
    },
    attached() {
      const { selectable } = info;

      this.setData({ selectable });
      this.$on("inited", this.setLogo);
    },
    detached() {
      this.$off("inited", this.setLogo);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.items"(value: ListComponentItemOptions[]): void {
      this.setLogo(value);
    },
  },
});

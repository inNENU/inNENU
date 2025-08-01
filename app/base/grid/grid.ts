import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type {
  GridComponentItemOptions,
  GridComponentOptions,
} from "../../../typings/index.js";
import { windowInfo } from "../../state/index.js";
import { getIconLink, getSizeClass, route } from "../../utils/index.js";

$Component({
  props: {
    /** 网格组件配置 */
    config: {
      type: Object as PropType<GridComponentOptions>,
      required: true,
    },

    /** 引用标题 */
    referer: {
      type: String,
      default: "",
    },
  },

  methods: {
    // 设置图标
    setLogo(items?: GridComponentItemOptions[]) {
      this.setData({
        icons: (items || this.data.config.items || []).map(({ icon }) =>
          getIconLink(icon),
        ),
      });
    },

    onResize({ size }: WechatMiniprogram.OnWindowResizeListenerResult) {
      this.setData({
        wideScreen: size.windowWidth >= 768,
        size: getSizeClass(size.windowWidth),
      });
    },

    onTap({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { item: GridComponentItemOptions }
    >) {
      const { referer } = this.data;
      const { item } = currentTarget.dataset;

      route(item, referer);
    },
  },

  lifetimes: {
    created() {
      this.setLogo = this.setLogo.bind(this);
      this.onResize = this.onResize.bind(this);
    },
    attached() {
      this.$on("inited", this.setLogo);
      this.setData({
        wideScreen: windowInfo.windowWidth >= 768,
        size: getSizeClass(windowInfo.windowWidth),
      });
      wx.onWindowResize(this.onResize);
    },
    detached() {
      this.$off("inited", this.setLogo);
      wx.offWindowResize(this.onResize);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.items"(value: GridComponentItemOptions[]): void {
      this.setLogo(value);
    },
  },
});

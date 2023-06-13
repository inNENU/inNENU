import { $Component, type PropType } from "@mptool/enhance";

import { type ImageComponentOptions } from "../../../../typings/index.js";

$Component({
  properties: {
    /** 图片组件配置 */
    config: {
      type: Object as PropType<ImageComponentOptions>,
      required: true,
    },

    /** 展示图片列表 */
    images: {
      type: Array as PropType<string[]>,
      default: [],
    },
  },

  methods: {
    /** 图片加载完成 */
    load(): void {
      this.setData({ loaded: true });
    },

    /** 图片加载出错 */
    error(): void {
      this.setData({ error: true });

      console.warn(`${this.data.config.src}图片加载失败`);
      wx.reportEvent?.("resource_load_failed", {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        broken_url: this.data.config.src,
      });
    },

    /** 进行图片预览 */
    view(): void {
      const current = this.data.config.res || this.data.config.src;

      wx.previewImage({
        current,
        urls: this.data.images.length === 0 ? [current] : this.data.images,
      });
    },
  },
});

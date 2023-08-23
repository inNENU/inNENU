import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { ImageComponentOptions } from "../../../typings/index.js";
import { imageWaterMark } from "../../config/index.js";

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
      const { src } = this.data.config;

      this.setData({ error: true });

      console.warn(`${src}图片加载失败`);
      wx.reportEvent?.("resource_load_failed", {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        broken_url: src,
      });
    },

    /** 进行图片预览 */
    view(): void {
      const { config, images } = this.data;
      const { res, src, watermark } = config;

      const current = `${res || src}${watermark ? imageWaterMark : ""}`;

      wx.previewImage({
        current,
        urls: images.length === 0 ? [current] : images,
      });
    },
  },
});

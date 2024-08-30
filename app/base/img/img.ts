import type { PropType } from "@mptool/all";
import { $Component, logger } from "@mptool/all";

import type { ImageComponentOptions } from "../../../typings/index.js";
import { imageWaterMark } from "../../config/index.js";
import { getPath } from "../../utils/index.js";

$Component({
  props: {
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

  data: {
    src: "",
  },

  lifetimes: {
    attached() {
      this.setData({
        src: getPath(this.data.config.src),
      });
    },
  },

  methods: {
    /** 图片加载完成 */
    load(): void {
      this.setData({ loaded: true });
    },

    /** 图片加载出错 */
    error(): void {
      const { src } = this.data;

      this.setData({ error: true });

      logger.warn("图片加载失败", src);
      wx.reportEvent?.("resource_load_failed", {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        broken_url: src,
      });
    },

    /** 进行图片预览 */
    view(): void {
      const { config, src, images } = this.data;
      const current = `${src}${config.watermark ? imageWaterMark : ""}`;

      wx.previewImage({
        current,
        urls: images.length === 0 ? [current] : images,
      });
    },
  },
});

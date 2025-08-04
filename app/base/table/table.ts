import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { TableComponentOptions } from "../../../typings/index.js";
import { info, windowInfo } from "../../state/index.js";

const FONT_SIZE = 14;
const PADDING_HORIZONTAL = 12 * 2; // 单元格的水平内边距总和 (padding-left + padding-right)

const CHINESE_CHAR_REGEX = /[\u4e00-\u9fa5]/;
const LATIN_UPPER_REGEX = /[A-Z]/;
const LATIN_LOWER_REGEX = /[a-z]/;
const NUMBER_REGEX = /[0-9]/;

const CHAR_WEIGHTS = {
  CHINESE: 1.0,
  LATIN_UPPER: 0.8,
  LATIN_LOWER: 0.6,
  NUMBER: 0.6,
  OTHER: 0.5,
};

const estimateTextWidth = (text: string): number => {
  let width = 0;

  for (const char of text) {
    if (CHINESE_CHAR_REGEX.test(char)) {
      width += CHAR_WEIGHTS.CHINESE;
    } else if (LATIN_UPPER_REGEX.test(char)) {
      width += CHAR_WEIGHTS.LATIN_UPPER;
    } else if (LATIN_LOWER_REGEX.test(char)) {
      width += CHAR_WEIGHTS.LATIN_LOWER;
    } else if (NUMBER_REGEX.test(char)) {
      width += CHAR_WEIGHTS.NUMBER;
    } else {
      width += CHAR_WEIGHTS.OTHER;
    }
  }

  return width * FONT_SIZE;
};

$Component({
  props: {
    /** 表格配置 */
    config: {
      type: Object as PropType<TableComponentOptions>,
      required: true,
      observer(newConfig: TableComponentOptions) {
        // 当 config 数据变化时，使用全局的 windowInfo 来进行初始计算
        this.setTableLayout(newConfig, windowInfo.windowWidth);
      },
    },
  },

  data: {
    columnWidths: [] as number[],
  },

  methods: {
    setTableLayout(config: TableComponentOptions, windowWidth: number) {
      if (!config?.header) return;

      const maxWidth = windowWidth / 2;
      const columnCount = config.header.length;
      const columnWidths = [];

      for (let i = 0; i < columnCount; i++) {
        let maxEstimatedWidth = 0;

        const headerWidth = estimateTextWidth(config.header[i]);

        if (headerWidth > maxEstimatedWidth) {
          maxEstimatedWidth = headerWidth;
        }

        if (config.body) {
          for (const row of config.body) {
            // 确保行数据不全时不会出错
            const cellWidth = estimateTextWidth(row[i] || "");

            if (cellWidth > maxEstimatedWidth) {
              maxEstimatedWidth = cellWidth;
            }
          }
        }

        const contentWidth = maxEstimatedWidth + PADDING_HORIZONTAL;
        const finalWidth = Math.min(contentWidth, maxWidth);

        columnWidths.push(finalWidth);
      }

      this.setData({ columnWidths: columnWidths });

      wx.nextTick(async () => {
        const selectQuery = this.createSelectorQuery();

        // calculate header and body heights
        const heights = await Promise.all([
          new Promise<number>((resolve) => {
            selectQuery
              .select(".tr.header")
              .boundingClientRect((res) => {
                resolve(res.height);
              })
              .exec();
          }),
          new Promise<number>((resolve) => {
            selectQuery
              .select(".tbody")
              .boundingClientRect((res) => {
                resolve(res.height);
              })
              .exec();
          }),
        ]);

        this.setData({
          tableHeight: heights.reduce((a, b) => a + b, 0),
        });
      });
    },

    onResize({ size }: WechatMiniprogram.OnWindowResizeListenerResult) {
      const { config } = this.data;

      this.setTableLayout(config, size.windowWidth);
    },
  },

  lifetimes: {
    created() {
      if (this.renderer === "skyline") this.onResize = this.onResize.bind(this);
    },
    attached() {
      const { selectable } = info;

      this.setData({
        selectable,
        renderer: this.renderer,
      });
      if (this.renderer === "skyline") {
        this.setTableLayout(this.data.config, windowInfo.windowWidth);
        wx.onWindowResize(this.onResize);
      }
    },
    detached() {
      if (this.renderer === "skyline") wx.offWindowResize(this.onResize);
    },
  },
});

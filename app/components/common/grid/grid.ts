import $register = require("wxpage");
import {
  GridComponentConfig,
  GridComponentItemComfig,
} from "../../../../typings";
import { readFile } from "../../../utils/file";

$register.C<{ config: GridComponentConfig }>({
  properties: {
    /** 网格组件配置 */
    config: { type: Object, value: { aim: "" } },
  },

  methods: {
    navigate({ currentTarget }: WechatMiniprogram.TouchEvent): void {
      this.$route(currentTarget.dataset.url);
    },
  },

  observers: {
    "config.content"(value: GridComponentItemComfig[]): void {
      // 设置图标
      this.setData({
        icons: value.map((item) =>
          "base64Icon" in item ? readFile(`icon/${item.base64Icon}`) || "" : ""
        ),
      });
    },
  },
});

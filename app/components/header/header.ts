import { $Component } from "@mptool/enhance";

import { type AppOption } from "../../app.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    title: {
      type: String,
    },
  },

  lifetimes: {
    attached() {
      const { statusBarHeight } = globalData.info;

      this.setData({
        statusBarHeight,
        firstPage: getCurrentPages().length === 1,
      });

      this.createSelectorQuery()
        .select(".header")
        .boundingClientRect(({ height }) => {
          this.setData({ height });
        })
        .exec();
    },
  },

  externalClasses: ["header-class"],
});

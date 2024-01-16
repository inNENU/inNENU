import { $Component } from "@mptool/all";

import { info } from "../../state/info.js";

$Component({
  properties: {
    title: {
      type: String,
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        statusBarHeight: info.statusBarHeight,
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

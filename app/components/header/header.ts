import { $Component } from "@mptool/all";

import { info } from "../../state/index.js";

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

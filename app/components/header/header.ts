import { $Component } from "@mptool/all";

import { info } from "../../state/index.js";

$Component({
  props: {
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
        .select(".header-component")
        .boundingClientRect(({ height }) => {
          this.setData({ height });
        })
        .exec();
    },
  },

  externalClasses: ["header-class"],
});

import { $Component } from "@mptool/all";

import { windowInfo } from "../../state/index.js";

$Component({
  props: {
    title: {
      type: String,
    },
  },

  data: {
    statusBarHeight: windowInfo.statusBarHeight,
  },

  lifetimes: {
    attached() {
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

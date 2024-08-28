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
      this.setData({
        firstPage: getCurrentPages().length === 1,
      });

      // FIXME: issues in QQ where the selector not working
    },
  },

  externalClasses: ["header-class"],
});

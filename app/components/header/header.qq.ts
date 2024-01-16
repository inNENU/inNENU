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

      // FIXME: issues in QQ where the selector not working
    },
  },

  externalClasses: ["header-class"],
});

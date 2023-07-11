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

      // FIXME: issues in QQ where the selector not working
    },
  },

  externalClasses: ["header-class"],
});

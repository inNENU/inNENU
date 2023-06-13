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

      // TODO: issues in QQ where the selector not working
    },
  },

  methods: {
    back() {
      if (getCurrentPages().length === 1) this.$switch("main");
      else this.$back();
    },
  },

  externalClasses: ["header-class"],
});

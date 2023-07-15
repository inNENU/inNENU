import { $Component } from "@mptool/all";

import { type AppOption } from "../../app.js";
import { defaultScroller, pageScrollMixin } from "../../mixins/page-scroll.js";

const { globalData } = getApp<AppOption>();

$Component({
  properties: {
    nav: Object,
  },

  data: {
    statusBarHeight: globalData.info.statusBarHeight,
    titleDisplay: false,
    borderDisplay: false,
    shadow: false,
    firstPage: false,
  },

  behaviors: [pageScrollMixin(defaultScroller)],

  methods: {
    setTheme(theme: string): void {
      this.setData({ theme });
    },
  },

  lifetimes: {
    attached() {
      this.setData({
        theme: globalData.theme,
        firstPage: getCurrentPages().length === 1,
      });

      // bind this
      this.setTheme = this.setTheme.bind(this);
      this.$on("theme", this.setTheme);
    },

    detached() {
      this.$off("theme", this.setTheme);
    },
  },
});

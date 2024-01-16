import { $Component } from "@mptool/all";

import { defaultScroller, pageScrollMixin } from "../../mixins/page-scroll.js";
import { info } from "../../utils/info.js";

$Component({
  properties: {
    nav: Object,
  },

  data: {
    statusBarHeight: info.statusBarHeight,
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
        theme: info.theme,
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

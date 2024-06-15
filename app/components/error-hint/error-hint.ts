import { $Component } from "@mptool/all";

$Component({
  props: {
    size: {
      type: String,
      default: "standard",
    },
    hint: {
      type: String,
      default: "获取失败",
    },
    hideRetry: Boolean,
  },

  methods: {
    retry() {
      this.triggerEvent("retry");
    },
  },

  externalClasses: ["wrapper-class"],
});

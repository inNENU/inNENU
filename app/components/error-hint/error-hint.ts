Component({
  properties: {
    size: {
      type: String,
      default: "standard",
    },
    hint: {
      type: String,
      default: "获取失败",
    },
  },

  methods: {
    retry() {
      this.triggerEvent("retry");
    },
  },

  externalClasses: ["custom-class"],
});

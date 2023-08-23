Component({
  properties: {
    size: {
      type: String,
      default: "standard",
    },
  },

  methods: {
    retry() {
      this.triggerEvent("retry");
    },
  },

  externalClasses: ["custom-class"],
});

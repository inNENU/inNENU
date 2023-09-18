import { $Component, PropType } from "@mptool/all";

$Component({
  properties: {
    size: {
      type: String as PropType<"mini" | "standard">,
      default: "standard",
    },
    source: String,
  },

  methods: {
    login() {
      const { source } = this.data;

      this.$go(`account?${source ? `from=${source}&` : ""}update=true`);
    },
  },

  externalClasses: ["wrapper-class"],
});

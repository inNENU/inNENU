import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

$Component({
  props: {
    size: {
      type: String as PropType<"mini" | "standard">,
      default: "standard",
    },
    source: String,
  },

  methods: {
    login() {
      const { source } = this.data;

      this.$go(`account-login?${source ? `from=${source}&` : ""}update=true`);
    },
  },

  externalClasses: ["wrapper-class"],
});

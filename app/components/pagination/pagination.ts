import { $Component } from "@mptool/all";

$Component({
  properties: {
    /** 当前页面 */
    current: {
      type: Number,
      required: true,
    },

    /** 页面总数 */
    total: {
      type: Number,
      required: true,
    },
  },

  methods: {
    prevPage() {
      this.triggerEvent("change", { current: this.data.current - 1 });
    },

    nextPage() {
      this.triggerEvent("change", { current: this.data.current + 1 });
    },

    changePage({ detail }: WechatMiniprogram.PickerChange) {
      this.triggerEvent("change", { current: Number(detail.value) + 1 });
    },
  },
});

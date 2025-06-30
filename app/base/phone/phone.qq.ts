import type { PropType } from "@mptool/all";
import { $Component, showToast, writeClipboard } from "@mptool/all";

import type { PhoneComponentData } from "../../../typings/index.js";

$Component({
  props: {
    /** 电话组件配置 */
    config: {
      type: Object as PropType<PhoneComponentData>,
      required: true,
    },
  },

  data: {
    showInfo: false,
  },

  methods: {
    /** 拨打电话 */
    call(): void {
      wx.makePhoneCall({ phoneNumber: this.data.config.num });
    },

    copyContact() {
      writeClipboard(this.data.config.num).then(() => {
        showToast("号码已复制");
      });
    },

    toggleInfo(): void {
      this.setData({
        showInfo: !this.data.showInfo,
      });
    },
  },

  options: {
    styleIsolation: "shared",
  },
});

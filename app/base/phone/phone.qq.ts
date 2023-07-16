import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { PhoneComponentOptions } from "../../../typings/index.js";
import { showToast } from "../../api/index.js";

$Component({
  properties: {
    /** 电话组件配置 */
    config: {
      type: Object as PropType<PhoneComponentOptions>,
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
      wx.setClipboardData({
        data: this.data.config.num,
        success: () => {
          showToast("号码已复制");
        },
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

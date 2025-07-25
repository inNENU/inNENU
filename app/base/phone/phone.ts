import type { PropType } from "@mptool/all";
import {
  $Component,
  addContact,
  env,
  showToast,
  writeClipboard,
} from "@mptool/all";

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

    /** 添加联系人 */
    addContact(): void {
      const { config } = this.data;

      if (env === "qq") {
        writeClipboard(this.data.config.num).then(() => {
          showToast("号码已复制");
        });
      } else
        addContact({
          firstName: config.fName,
          lastName: config.lName,
          mobilePhoneNumber: config.num,
          organization: config.org,
          workPhoneNumber: config.workNum,
          remark: config.remark,
          photoFilePath: config.avatar,
          nickName: config.nick,
          weChatNumber: config.wechat,
          addressState: config.province,
          addressCity: config.city,
          addressStreet: config.street,
          addressPostalCode: config.postCode,
          title: config.title,
          hostNumber: config.hostNum,
          email: config.mail,
          url: config.site,
          homePhoneNumber: config.homeNum,
        });
    },

    toggleInfo(): void {
      this.setData({
        showInfo: !this.data.showInfo,
      });
    },
  },

  // Note: For QQ Only
  options: {
    styleIsolation: "shared",
  },
});

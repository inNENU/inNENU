import { $Component, type PropType } from "@mptool/enhance";

import { type PhoneComponentOptions } from "../../../../typings/index.js";
import { addPhoneContact } from "../../../utils/api.js";

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

    /** 添加联系人 */
    addContact(): void {
      const { config } = this.data;

      addPhoneContact({
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
});

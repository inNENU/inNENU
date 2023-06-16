import { $Component, type PropType } from "@mptool/enhance";

import { type AccountComponentOptions } from "../../../../typings/index.js";
import { modal, savePhoto, tip } from "../../../utils/api.js";

$Component({
  properties: {
    /** 介绍组件配置 */
    config: {
      type: Object as PropType<AccountComponentOptions>,
      required: true,
    },
  },

  methods: {
    /** 添加 QQ */
    addQQ(): void {
      const { qq, qqcode = "" } = this.data.config;

      if (qqcode)
        savePhoto(qqcode, true)
          .then(() => tip("二维码已存至相册"))
          .catch(() => tip("二维码保存失败"));
      else if (qq)
        wx.setClipboardData({
          data: qq.toString(),
          success: () => {
            modal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
          },
        });
    },

    /** 微信 */
    addWechat(): void {
      const { account, wxid, wxcode } = this.data.config;

      if (account) this.$go(`account-detail?path=${account}`);
      else if (wxcode)
        savePhoto(wxcode, true)
          .then(() => tip("二维码已存至相册"))
          .catch(() => tip("二维码保存失败"));
      else if (wxid)
        wx.previewImage({
          urls: [`https://open.weixin.qq.com/qr/code?username=${wxid}`],
        });
    },

    openSite(): void {
      const { site } = this.data.config;

      this.$go(`web?url=${site!}`);
    },

    copyEmail(): void {
      const { mail } = this.data.config;

      wx.setClipboardData({
        data: mail!,
        success: () =>
          modal("复制成功", `邮箱地址 ${mail!} 已成功复制至剪切板`),
      });
    },
  },
});
import type { PropType } from "@mptool/all";
import { $Component } from "@mptool/all";

import type { AccountComponentOptions } from "../../../typings/index.js";
import {
  savePhoto,
  setClipboard,
  showModal,
  showToast,
} from "../../api/index.js";
import { startNavigation } from "../../utils/location.js";

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
        savePhoto(qqcode)
          .then(() => showToast("二维码已存至相册"))
          .catch(() => showToast("二维码保存失败"));
      else if (qq)
        setClipboard(qq.toString()).then(() => {
          showModal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
        });
    },

    /** 添加微信 */
    addWechat(): void {
      const { account, wxid, wxcode } = this.data.config;

      if (account) this.$go(`wechat-detail?path=${account}`);
      else if (wxcode)
        savePhoto(wxcode)
          .then(() => showToast("二维码已存至相册"))
          .catch(() => showToast("二维码保存失败"));
      else if (wxid)
        wx.previewImage({
          urls: [`https://open.weixin.qq.com/qr/code?username=${wxid}`],
        });
    },

    openSite(): void {
      const { site } = this.data.config;

      setClipboard(site).then(() => {
        showModal(
          "功能受限",
          "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
        );
      });
    },

    copyEmail(): void {
      const { mail } = this.data.config;

      setClipboard(mail).then(() =>
        showModal("复制成功", `邮箱地址 ${mail!} 已成功复制至剪切板`),
      );
    },

    navigate(): void {
      const { location, name } = this.data.config;

      startNavigation(JSON.stringify({ name, ...location }));
    },
  },
});

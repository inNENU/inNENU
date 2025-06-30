import type { PropType } from "@mptool/all";
import {
  $Component,
  savePhoto,
  showModal,
  showToast,
  writeClipboard,
} from "@mptool/all";

import type { AccountComponentData } from "../../../typings/index.js";
import { env, isCompany } from "../../state/index.js";
import { getAssetLink, startNavigation } from "../../utils/index.js";

$Component({
  props: {
    /** 介绍组件配置 */
    config: {
      type: Object as PropType<AccountComponentData>,
      required: true,
    },
  },

  data: {
    isCompany,
    env,
  },

  lifetimes: {
    attached() {
      this.setData({ logo: getAssetLink(this.data.config.logo) });
    },
  },

  methods: {
    /** 添加 QQ */
    addQQ(): void {
      const { qq, qqcode = "" } = this.data.config;

      if (qqcode) {
        const realQQCodePath = getAssetLink(qqcode);

        if (env === "qq")
          // QQ 可直接长按扫码添加好友
          wx.previewImage({
            urls: [realQQCodePath],
          });
        // 其他平台需保存至相册
        else
          savePhoto(realQQCodePath)
            .then(() => showToast("二维码已存至相册"))
            .catch(() => showToast("二维码保存失败"));
      } else if (qq)
        writeClipboard(qq.toString()).then(() => {
          showModal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
        });
    },

    /** 微信 */
    addWechat(): void {
      const { account, wxid } = this.data.config;

      if (account) this.$go(`wechat?path=${account}`);
      else if (wxid)
        if (env === "wx")
          // 微信客户端可打开图片长按扫码
          wx.previewImage({
            urls: [`https://open.weixin.qq.com/qr/code?username=${wxid}`],
          });
        // 其他平台保存至相册
        else
          savePhoto(`https://open.weixin.qq.com/qr/code?username=${wxid}`)
            .then(() => showToast("二维码已存至相册"))
            .catch(() => showToast("二维码保存失败"));
    },

    openSite(): void {
      const { site } = this.data.config;

      // app 可直接打开网址
      if (env === "app") wx.miniapp.openUrl({ url: site! });
      else
        writeClipboard(site).then(() => {
          showModal(
            "功能受限",
            "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
          );
        });
    },

    copyEmail(): void {
      const { mail } = this.data.config;

      writeClipboard(mail).then(() =>
        showModal("复制成功", `邮箱地址 ${mail!} 已成功复制至剪切板`),
      );
    },

    navigate(): void {
      const { name, loc } = this.data.config;

      startNavigation({ name, loc: loc! });
    },
  },
});

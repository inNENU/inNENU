import type { PropType } from "@mptool/all";
import {
  $Component,
  env,
  savePhoto,
  showModal,
  showToast,
  writeClipboard,
} from "@mptool/all";

import type { AccountComponentData } from "../../../typings/index.js";
import { isCompany } from "../../state/index.js";
import {
  getAssetLink,
  showOfficialQRCode,
  startNavigation,
  tryOpenOfficialProfile,
} from "../../utils/index.js";

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
        else
          // 其他平台需保存至相册
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

      if (wxid)
        tryOpenOfficialProfile(wxid, () => {
          if (account) this.$go(`wechat?path=${account}`);
          else showOfficialQRCode(wxid);
        });
      else if (account) this.$go(`wechat?path=${account}`);
    },

    openSite(): void {
      const { site } = this.data.config;

      // app 可直接打开网址
      if (env === "donut") wx.miniapp.openUrl({ url: site! });
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

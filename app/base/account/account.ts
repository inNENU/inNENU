import type { PropType } from "@mptool/all";
import { $Component, env, savePhoto, showModal, showToast, writeClipboard } from "@mptool/all";

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

  methods: {
    /** 添加 QQ */
    async addQQ(): Promise<void> {
      const { qq, qqcode = "" } = this.data.config;

      if (qqcode) {
        const realQQCodePath = getAssetLink(qqcode);

        // 保存至相册
        savePhoto(realQQCodePath)
          .then(() => showToast("二维码已存至相册"))
          .catch(() => showToast("二维码保存失败"));
      } else if (qq) {
        await writeClipboard(qq.toString());
        showModal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
      }
    },

    /** 微信 */
    addWechat(): void {
      const { account, wxid } = this.data.config;

      if (wxid) {
        tryOpenOfficialProfile(wxid, () => {
          if (account) this.$go(`wechat?path=${account}`);
          else showOfficialQRCode(wxid);
        });
      } else if (account) {
        this.$go(`wechat?path=${account}`);
      }
    },

    async openSite(): Promise<void> {
      const { site } = this.data.config;

      // app 可直接打开网址
      if (env === "donut") {
        wx.miniapp.openUrl({ url: site! });
      } else {
        await writeClipboard(site);
        showModal("功能受限", "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。");
      }
    },

    async copyEmail(): Promise<void> {
      const { mail } = this.data.config;

      await writeClipboard(mail);
      showModal("复制成功", `邮箱地址 ${mail!} 已成功复制至剪切板`);
    },

    navigate(): void {
      const { name, loc } = this.data.config;

      startNavigation({ name, loc: loc! });
    },
  },

  lifetimes: {
    attached() {
      this.setData({ logo: getAssetLink(this.data.config.logo) });
    },
  },
});

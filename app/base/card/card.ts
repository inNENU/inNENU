import type { PropType } from "@mptool/all";
import { $Component, readFile, showModal, writeClipboard } from "@mptool/all";

import type { CardComponentOptions } from "../../../typings/index.js";
import { env } from "../../state/index.js";

$Component({
  props: {
    config: {
      type: Object as PropType<CardComponentOptions>,
      required: true,
    },
  },

  methods: {
    /** 点击卡片触发的操作 */
    tap(): void {
      const { config } = this.data;

      if ("appId" in config) {
        if (env === "wx") {
          wx.navigateToMiniProgram({
            appId: config.appId,
            path: config.path,
            extraData: config.extraData,
            envVersion: config.versionType,
          });
        } else if (env === "app") {
          const { appId, path, versionType } = config;

          if (appId && path)
            wx.miniapp.launchMiniProgram({
              userName: appId,
              path,
              miniprogramType:
                versionType === "develop" ? 1 : versionType === "trial" ? 2 : 0,
            });
          else {
            showModal("无法打开", "暂不支持打开微信小程序短链");
          }
        } else {
          showModal("无法打开", "暂不支持打开微信小程序");
        }
      } else if ("path" in config) this.$go(`info?path=${config.path}`);
      // 页面路径
      else if (!/^https?:\/\//.test(config.url)) this.$go(config.url);
      // 为链接
      else {
        // 打开浏览器或 App
        if (env === "app") wx.miniapp.openUrl({ url: config.url });
        // 判断是否是可以跳转的微信图文
        else if (
          env === "wx" &&
          config.url.startsWith("https://mp.weixin.qq.com") &&
          wx.openOfficialAccountArticle
        ) {
          wx.openOfficialAccountArticle({ url: config.url });
        }
        // 无法跳转，复制链接到剪切板
        else
          writeClipboard(config.url).then(() => {
            showModal(
              "无法直接打开",
              "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
            );
          });
      }
    },

    setLogo(value?: string) {
      const logo = value || this.data.config.logo;

      // 设置图标
      if (logo && !logo.includes("/"))
        this.setData({
          base64Logo: readFile(`icon/${logo}`) || "",
        });
    },
  },

  lifetimes: {
    attached() {
      this.setLogo = this.setLogo.bind(this);
      this.$on("inited", this.setLogo);
    },

    detached() {
      this.$off("inited", this.setLogo);
    },
  },

  observers: {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "config.logo"(value: string): void {
      this.setLogo(value);
    },
  },
});

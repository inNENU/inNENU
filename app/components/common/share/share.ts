import { $Component, type PropType, logger } from "@mptool/enhance";

import { type PageData } from "../../../../typings/index.js";
import { type AppOption } from "../../../app.js";
import { modal, savePhoto, tip } from "../../../utils/api.js";
import { appName, server } from "../../../utils/config.js";

const {
  globalData: { appID },
} = getApp<AppOption>();

type ShareConfig = Pick<
  PageData,
  "id" | "contact" | "qrcode" | "title" | "shareable"
>;

interface ActionConfig {
  icon: string;
  text: string;
  hidden?: boolean;
  openType?: string;
  action?: string;
}

type LinkData = { error: true } | { error: false; link: string };

$Component({
  properties: {
    config: {
      type: Object as PropType<ShareConfig>,
      default: { id: "" },
    },
  },

  methods: {
    /** 二维码下载 */
    download(): void {
      const { config } = this.data;

      savePhoto(
        `/qrcode/${appID}/${
          typeof config.qrcode === "string" ? config.qrcode : config.id!
        }.png`
      )
        .then(() => tip("二维码已存至相册"))
        .catch(() => tip("二维码保存失败"));
    },

    wechatMomentShare() {
      this.hint("转发到朋友圈");
    },

    wechatStar() {
      this.hint("收藏");
    },

    hint(msg: string) {
      modal(
        "功能受限",
        `受到微信客户端限制，请您点击右上角菜单(···)以${msg}。`
      );
    },

    copyWechatLink() {
      wx.request<LinkData>({
        url: `${server}service/share-link.php`,
        enableHttp2: true,
        method: "POST",
        data: { appID, id: this.data.config.id! },
        success: ({ data, statusCode }) => {
          if (statusCode === 200 && !data.error) this.copy(data.link);
          else modal("链接尚未生成", "请使用小程序右上角菜单(···)来复制链接。");
        },
      });
    },

    copy(link: string) {
      const { title } = this.data.config;
      const content = `${title ? `${appName}查看『${title}』:` : ""}${link}`;

      wx.setClipboardData({
        data: content,
        success: () => {
          tip("链接已复制");
          logger.debug(`Share content is copied: ${content}`);
        },
      });
    },
  },

  observers: {
    config(config: ShareConfig): void {
      const actions: ActionConfig[] = [];

      if (config.shareable) {
        actions.push(
          {
            icon: "/icon/wechat",
            text: "分享给好友",
            openType: "share",
          },
          {
            icon: "./icon/moments",
            text: "分享到朋友圈",
            action: "wechatMomentShare",
          },
          {
            icon: "./icon/link",
            text: "复制链接",
            action: "copyWechatLink",
          },
          {
            icon: "./icon/star",
            text: "收藏",
            action: "wechatStar",
          }
        );

        if (config.qrcode !== false)
          actions.push({
            icon: "./icon/qrcode",
            text: "下载二维码",
            action: "download",
          });
      }

      if (config.contact !== false)
        actions.push({
          icon: "./icon/contact",
          text: "联系 Mr.Hope",
          openType: "contact",
        });

      this.setData({ actions });
    },
  },
});

import type { PropType } from "@mptool/all";
import { $Component, logger } from "@mptool/all";

import type { PageData } from "../../../typings/index.js";
import { savePhoto, setClipboard, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appName, service } from "../../config/index.js";
import { path2id } from "../../utils/id.js";

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
  openId?: string;
  shareMode?: string[];
  action?: string;
}

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
        typeof config.qrcode === "string"
          ? config.qrcode
          : `${service}qrcode?appID=${appID}&page=${encodeURI(
              `pages/info/info?path=${path2id(this.data.config.id)}`,
            )}`,
      )
        .then(() => showToast("二维码已存至相册"))
        .catch(() => showToast("二维码保存失败"));
    },

    copyQQLink() {
      this.copy(
        `https://m.q.qq.com/a/p/${appID}?s=${encodeURI(
          `pages/info/info?path=${path2id(this.data.config.id)}`,
        )}`,
      );
    },

    copy(link: string) {
      const { title } = this.data.config;
      const content = `${title ? `${appName}查看『${title}』:` : ""}${link}`;

      setClipboard(content).then(() => {
        showToast("链接已复制");
        logger.debug(`Share content is copied: ${content}`);
      });
    },
  },

  observers: {
    config(config: ShareConfig): void {
      const actions: ActionConfig[] = [];

      if (config.shareable) {
        actions.push(
          {
            icon: "./icon/recent",
            text: "分享给最近联系人",
            openType: "share",
            shareMode: ["recentContacts"],
          },
          {
            icon: "/icon/qq",
            text: "分享给好友",
            openType: "share",
            shareMode: ["qq"],
          },
          {
            icon: "./icon/qzone",
            text: "分享到空间",
            openType: "share",
            shareMode: ["qzone"],
          },
          {
            icon: "./icon/link",
            text: "复制链接",
            action: "copyQQLink",
          },
          {
            icon: "./icon/star",
            text: "收藏",
            openType: "addToFavorites",
          },
          {
            icon: "/icon/wechat",
            text: "分享给微信好友",
            openType: "share",
            shareMode: ["wechatFriends"],
          },
          {
            icon: "./icon/moments",
            text: "分享到朋友圈",
            openType: "share",
            shareMode: ["wechatMoment"],
          },
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
          openType: "addFriend",
          openId: "868D7B2F0C609B4285698EAB77A47BA1",
        });

      this.setData({ actions });
    },
  },

  options: {
    styleIsolation: "apply-shared",
  },
});

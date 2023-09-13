import type { PropType } from "@mptool/all";
import { $Component, logger } from "@mptool/all";

import type { PageData } from "../../../typings/index.js";
import {
  request,
  savePhoto,
  setClipboard,
  showModal,
  showToast,
} from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appName, server, service } from "../../config/index.js";
import { path2id } from "../../utils/id.js";
import { reportInfo } from "../../utils/report.js";

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

  lifetimes: {
    attached() {
      this.setPassiveEvent?.({
        touchstart: false,
        touchmove: false,
        wheel: false,
      });
    },
  },

  methods: {
    /** 二维码下载 */
    download(): void {
      const { config } = this.data;

      savePhoto(
        typeof config.qrcode === "string"
          ? config.qrcode
          : `${service}mp/qrcode?appID=${appID}&page=pages/info/info&scene=${path2id(
              config.id,
            )}`,
      )
        .then(() => showToast("二维码已存至相册"))
        .catch(() => showToast("二维码保存失败"));
    },

    wechatMomentShare() {
      this.hint("转发到朋友圈");
    },

    wechatStar() {
      this.hint("收藏");
    },

    hint(msg: string) {
      showModal(
        "功能受限",
        `受到微信客户端限制，请您点击右上角菜单(···)以${msg}。`,
      );
    },

    copyWechatLink() {
      request<LinkData>(`${server}service/share-link.php`, {
        method: "POST",
        data: { appID, id: this.data.config.id! },
      }).then((data) => {
        if (data.error)
          showModal("链接尚未生成", "请使用小程序右上角菜单(···)来复制链接。");
        else this.copy(data.link);
      });
    },

    copy(link: string) {
      const { title } = this.data.config;
      const content = `${title ? `${appName}查看『${title}』:` : ""}${link}`;

      setClipboard(content).then(() => {
        showToast("链接已复制");
        logger.debug(`Share content is copied: ${content}`);
      });
    },

    reportInfo,
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
          openType: "contact",
          action: "reportInfo",
        });

      this.setData({ actions });
    },
  },
});

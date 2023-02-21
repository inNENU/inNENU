import { $Page } from "@mptool/enhance";

import { type WechatConfig } from "../../../typings";
import { type AppOption } from "../../app";
import { modal, tip } from "../../utils/api";
import { appCoverPrefix, server } from "../../utils/config";
import { ensureJSON } from "../../utils/json";
import { getColor, popNotice } from "../../utils/page";

const { globalData } = getApp<AppOption>();

$Page("wechat-detail", {
  data: {
    loading: true,
    config: <WechatConfig>{},
    statusBarHeight: globalData.info.statusBarHeight,
    footer: {
      desc: "更新文章，请联系 Mr.Hope",
    },
  },

  state: {
    path: "",
  },

  onNavigate(options) {
    if (options.path) ensureJSON(`function/account/${options.path}`);
  },

  onLoad({ path = "" }) {
    this.setData({
      darkmode: globalData.darkmode,
      firstPage: getCurrentPages().length === 1,
      color: getColor(true),
    });

    wx.request<WechatConfig>({
      url: `${server}service/account.php`,
      enableHttp2: true,
      method: "POST",
      data: { id: path },
      success: ({ data, statusCode }) => {
        if (statusCode === 200) this.setData({ loading: false, config: data });
        else tip("服务器出现问题");
      },
    });

    this.state.path = path;

    popNotice(`account/${this.data.config.name}`);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.config.name,
      path: `/function/account/detail?path=${this.state.path}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.config.name,
      query: `path=${this.state.path}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.config.name,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `path=${this.state.path}`,
    };
  },

  navigate({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    never,
    never,
    { title: string; url: string }
  >) {
    const { title, url } = currentTarget.dataset;

    if (this.data.config.authorized) this.$go(`web?url=${url}&title=${title}`);
    // 无法跳转，复制链接到剪切板
    else
      wx.setClipboardData({
        data: url,
        success: () => {
          modal(
            "尚未授权",
            "目前暂不支持跳转到该微信公众号图文，链接地址已复制至剪切板。请打开浏览器粘贴查看"
          );
        },
      });
  },

  follow() {
    const { follow, qrcode } = this.data.config;

    if (follow) this.$go(`web?url=${follow}&title=欢迎关注`);
    else wx.previewImage({ urls: [qrcode] });
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});

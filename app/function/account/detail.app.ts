import { $Page } from "@mptool/enhance";

import { type WechatConfig } from "../../../typings/index.js";
import { type AppOption } from "../../app.js";
import { tip } from "../../utils/api.js";
import { server } from "../../utils/config.js";
import { ensureJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

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

  navigate({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    never,
    never,
    { title: string; url: string }
  >) {
    const { title, url } = currentTarget.dataset;

    this.$go(`web?url=${url}&title=${title}`);
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

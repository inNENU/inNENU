import { $Page } from "@mptool/enhance";
import createRecycleContext = require("miniprogram-recycle-view");

import {
  type WechatArticleItem,
  type WechatConfig,
} from "../../../typings/index.js";
import { savePhoto } from "../../api/media.js";
import { showModal, showToast } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix, server } from "../../config/info.js";
import { ensureJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();
const PAGE_ID = "wechat-detail";

$Page(PAGE_ID, {
  data: {
    loading: true,
    config: <WechatConfig>{},
    statusBarHeight: globalData.info.statusBarHeight,
    footer: {
      desc: "更新文章，请联系 Mr.Hope",
    },
    showBackToTop: false,
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

    this.state.path = path;

    popNotice(`wechat/${this.data.config.name}`);
  },

  onShow() {
    const { windowWidth, windowHeight } = globalData.info;

    this.setData({
      windowWidth,
      windowHeight,
    });
  },

  onReady() {
    const ctx = createRecycleContext<WechatArticleItem>({
      id: "recycleId",
      dataKey: "recycleList",
      page: this,
      itemSize: this.getItemSize,
    });

    this.ctx = ctx;

    wx.request<WechatConfig>({
      method: "POST",
      url: `${server}service/account.php`,
      data: { id: this.state.path },
      enableHttp2: true,
      success: ({ data, statusCode }) => {
        if (statusCode === 200) {
          this.setData({ loading: false, config: data });

          ctx.append(data.article);
        } else showToast("服务器出现问题");
      },
    });
  },

  onPageScroll(options) {
    if (options.scrollTop > 250 + globalData.info.statusBarHeight)
      this.setData({ showBackToTop: true });
    else this.setData({ showBackToTop: false });
  },

  onResize({ size }) {
    this.setData(size);
    this.ctx.forceUpdate(() => {
      // do nothing
    }, false);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.config.name,
      path: `/function/school-media/wechat?path=${this.state.path}`,
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

  getItemSize(item: WechatArticleItem) {
    const width = globalData.info.windowWidth - 30;

    return {
      width,
      height:
        Math.min((globalData.info.windowWidth / 75) * 29, 220) +
        (item.desc ? 68 : 48),
    };
  },

  navigate({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    never,
    never,
    { title: string; url: string }
  >) {
    const { url } = currentTarget.dataset;

    wx.setClipboardData({
      data: url,
      success: () => {
        showModal(
          "无法跳转",
          "QQ小程序并不支持跳转微信图文，链接地址已复制至剪切板。请打开浏览器粘贴查看",
        );
      },
    });
  },

  follow() {
    const { qrcode } = this.data.config;

    savePhoto(qrcode)
      .then(() => showToast("二维码已存至相册"))
      .catch(() => showToast("二维码保存失败"));
  },

  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0 });
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },

  ctx: null as unknown as ReturnType<
    typeof createRecycleContext<WechatArticleItem>
  >,
});

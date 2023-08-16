import { $Page } from "@mptool/all";
import createRecycleContext = require("miniprogram-recycle-view");

import type {
  WechatArticleItem,
  WechatConfig,
} from "../../../typings/index.js";
import { request, showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, server } from "../../config/index.js";
import { ensureJSON } from "../../utils/json.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();
const PAGE_ID = "wechat-detail";

interface WechatArticleItemWithSize extends WechatArticleItem {
  width: number;
  height: number;
}

$Page(PAGE_ID, {
  data: {
    loading: true,
    name: "",
    desc: "",
    logo: "",
    id: "",
    qrcode: "",
    authorized: false,
    follow: "",

    statusBarHeight: globalData.info.statusBarHeight,
    showBackToTop: false,
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
      firstPage: getCurrentPages().length === 1,
      color: getColor(true),
    });

    this.state.path = path;

    popNotice(`wechat/${path}`);
  },

  onShow() {
    const { windowWidth, windowHeight } = globalData.info;

    this.setData({
      windowWidth,
      windowHeight,
    });
  },

  onReady() {
    const ctx = createRecycleContext<WechatArticleItemWithSize>({
      id: "recycleId",
      dataKey: "recycleList",
      page: this,
      itemSize: ({ width, height }) => ({ width, height }),
    });

    this.ctx = ctx;

    request<WechatConfig>(`${server}service/account.php`, {
      method: "POST",
      data: { id: this.state.path },
    })
      .then((data) => {
        const {
          article,
          name,
          desc,
          logo,
          id,
          qrcode,
          authorized = false,
          follow = "",
        } = data;

        this.setData({
          loading: false,
          name,
          desc,
          logo,
          id,
          qrcode,
          authorized,
          follow,
        });

        ctx.append(article.map(this.appendSize));
      })
      .catch(() => {
        showToast("服务器出现问题");
      });
  },

  onPageScroll(options) {
    if (options.scrollTop > 250 + globalData.info.statusBarHeight)
      this.setData({ showBackToTop: true });
    else this.setData({ showBackToTop: false });
  },

  onResize({ size }) {
    this.setData(size);
    this.ctx.updateList(0, this.ctx.getList().map(this.appendSize));
    this.ctx.forceUpdate(() => {
      // do nothing
    }, false);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.name,
      path: `/function/school-media/wechat?path=${this.state.path}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.name,
      query: `path=${this.state.path}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.name,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `path=${this.state.path}`,
    };
  },

  appendSize(item: WechatArticleItem) {
    const width = Math.min(globalData.info.windowWidth - 30, 517);
    const titleCharPerLine = Math.floor((width - 30) / 16);
    const descCharPerLine = Math.floor((width - 30) / 14);

    return {
      ...item,
      width,
      height:
        // image height
        (width / 47) * 20 +
        // card margin + info padding
        30 +
        // title height
        Math.ceil(item.title.length / titleCharPerLine) * 24 +
        (item.desc
          ? // desc height
            Math.ceil(item.desc.length / descCharPerLine) * 21 +
            // desc margin
            4
          : 0),
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

    if (this.data.authorized)
      this.$go(`web?url=${encodeURIComponent(url)}&title=${title}`);
    // 无法跳转，复制链接到剪切板
    else
      wx.setClipboardData({
        data: url,
        success: () => {
          showModal(
            "尚未授权",
            "目前暂不支持跳转到该微信公众号图文，链接地址已复制至剪切板。请打开浏览器粘贴查看",
          );
        },
      });
  },

  follow() {
    const { follow, qrcode } = this.data;

    if (follow) this.$go(`web?url=${follow}&title=欢迎关注`);
    else wx.previewImage({ urls: [qrcode] });
  },

  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0 });
  },

  ctx: null as unknown as ReturnType<
    typeof createRecycleContext<WechatArticleItem>
  >,
});

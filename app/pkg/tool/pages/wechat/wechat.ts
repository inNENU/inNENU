import {
  $Page,
  env,
  savePhoto,
  showModal,
  showToast,
  writeClipboard,
} from "@mptool/all";

import type {
  WechatAccountData,
  WechatArticle,
} from "../../../../../typings/index.js";
import { request } from "../../../../api/index.js";
import { appCoverPrefix, server } from "../../../../config/index.js";
import { info, windowInfo } from "../../../../state/index.js";
import {
  ensureJson,
  getAssetLink,
  getPageColor,
  showNotice,
  showOfficialQRCode,
  tryOpenOfficialProfile,
} from "../../../../utils/index.js";
import { createRecycleContext } from "../../components/recycle-view/index.js";

const PAGE_ID = "wechat";

interface WechatArticleItemWithSize extends WechatArticle {
  width: number;
  height: number;
}

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    loading: true,
    name: "",
    desc: "",
    logo: "",
    id: "",
    follow: "",

    showBackToTop: false,
    footer: {
      desc: "更新文章，请联系 Mr.Hope",
    },
  },

  state: {
    path: "",
  },

  onNavigate(options) {
    if (options.path) ensureJson(`function/account/${options.path}`);
  },

  onLoad({ path = "" }) {
    this.setData({
      theme: info.theme,
      color: getPageColor(true),
    });

    this.state.path = path;

    showNotice(`wechat/${path}`);
  },

  onShow() {
    const { windowWidth, windowHeight } = windowInfo;

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

    request<WechatAccountData>(`${server}service/account.php`, {
      method: "POST",
      body: { id: this.state.path },
    })
      .then(({ data }) => {
        const { article, name, desc, logo, id, follow = "" } = data;

        this.setData({
          loading: false,
          name,
          desc,
          logo: getAssetLink(logo),
          id,
          follow,
        });

        ctx.append(article.map(this.appendSize));
      })
      .catch(() => {
        showToast("服务器出现问题");
      });
  },

  onPageScroll(options) {
    if (options.scrollTop > 250 + windowInfo.statusBarHeight)
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
      path: `/pkg/tool/pages/wechat/wechat?path=${this.state.path}`,
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

  appendSize(item: WechatArticle) {
    const width = Math.min(windowInfo.windowWidth - 30, 517);
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
    const { url } = currentTarget.dataset;

    if (env === "donut") wx.miniapp.openUrl({ url });
    else if (wx.openOfficialAccountArticle)
      wx.openOfficialAccountArticle({ url });
    else
      writeClipboard(url).then(() => {
        showModal(
          "无法跳转",
          "目前暂不支持跳转到该微信公众号图文，链接地址已复制至剪切板。请打开浏览器粘贴查看",
        );
      });
  },

  follow() {
    const { follow, id } = this.data;

    tryOpenOfficialProfile(id, () => {
      if (env === "donut")
        savePhoto(`https://open.weixin.qq.com/qr/code?username=${id}`)
          .then(() => showToast("二维码已存至相册"))
          .catch(() => showToast("二维码保存失败"));
      else if (follow) this.$go(`web?url=${follow}&title=欢迎关注`);
      else showOfficialQRCode(id);
    });
  },

  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0 });
  },

  ctx: null as unknown as ReturnType<
    typeof createRecycleContext<WechatArticle>
  >,
});

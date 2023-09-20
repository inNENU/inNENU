import { $Page } from "@mptool/all";
import createRecycleContext = require("miniprogram-recycle-view");

import type {
  WechatArticleItem,
  WechatConfig,
} from "../../../typings/index.js";
import { request, savePhoto, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { server } from "../../config/index.js";
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
    const { url } = currentTarget.dataset;

    wx.miniapp.openUrl({ url });
  },

  follow() {
    const { qrcode, id } = this.data;

    savePhoto(qrcode ?? `https://open.weixin.qq.com/qr/code?username=${id}`)
      .then(() => showToast("二维码已存至相册"))
      .catch(() => showToast("二维码保存失败"));
  },

  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0 });
  },

  ctx: null as unknown as ReturnType<
    typeof createRecycleContext<WechatArticleItem>
  >,
});

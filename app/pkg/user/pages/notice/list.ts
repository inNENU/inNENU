import { $Page, showToast } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { NoticeInfo } from "../../../../service/index.js";
import { getNoticeList } from "../../../../service/index.js";
import { info, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "notice-list";

$Page(PAGE_ID, {
  data: {
    title: "",

    theme: info.theme,

    status: "success" as "error" | "login" | "success",
    notices: [] as NoticeInfo[],
    current: 1,
    total: 1,
  },

  state: {
    type: "notice" as "notice" | "news",
    inited: false,
  },

  onLoad({ type = "notice" }) {
    this.state.type = type as "notice" | "news";
    this.setData({
      color: getPageColor(),
      theme: info.theme,
      title: `学校${type === "news" ? "新闻" : "通知"}`,
    });
  },

  onShow() {
    if (user.account) {
      if (this.data.status === "login" || !this.state.inited)
        this.getNoticeList(1);
    } else {
      this.setData({ status: "login" });
    }

    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.title,
      path: `/pkg/user/pages/notice/list?type=${this.state.type}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return { title: this.data.title, query: `type=${this.state.type}` };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${this.state.type}`,
    };
  },

  async getNoticeList(current = 1) {
    if (!user.account) {
      this.setData({ status: "login" });

      return;
    }

    wx.showLoading({ title: "获取中" });

    const result = await getNoticeList({
      type: this.state.type,
      current,
    });

    wx.hideLoading();
    this.state.inited = true;

    if (result.success) {
      this.setData({
        status: "success",
        scrollTop: 0,
        notices: result.data,
        current: result.current,
        total: result.total,
      });
    } else {
      showToast(result.msg);
      this.setData({ status: "error" });
    }
  },

  retry() {
    return this.getNoticeList(1);
  },

  changePage({ detail }: WechatMiniprogram.CustomEvent<{ current: number }>) {
    return this.getNoticeList(detail.current);
  },

  viewNotice({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { title, id, url } = this.data.notices[index];
    const { type } = this.state;

    return this.$go(
      `notice-detail?from=${this.data.title}&title=${title}&type=${type}&${url ? `url=${url}` : `id=${id}`}`,
    );
  },
});

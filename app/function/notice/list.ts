import { $Page } from "@mptool/all";

import { getNoticeList } from "./api.js";
import { type NoticeItem } from "./typings.js";
import { ensureActionLogin } from "../../api/login/action.js";
import { showToast } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "notice-list";

$Page(PAGE_ID, {
  data: {
    title: "",

    theme: globalData.theme,

    status: <"error" | "login" | "success">"success",
    notices: <NoticeItem[]>[],
    currentPage: 1,
    totalPage: 1,
  },

  state: {
    type: <"notice" | "news">"notice",
    inited: false,
  },

  onLoad({ type = "notice" }) {
    this.state.type = <"notice" | "news">type;
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      title: `内网${type === "news" ? "新闻" : "通知"}`,
    });
  },

  onShow() {
    if (!this.state.inited) this.getNoticeList(1, true);
    else if (globalData.account) {
      if (this.data.status === "login") this.getNoticeList(1, true);
    } else this.setData({ status: "login" });

    popNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.title,
      path: `/function/notice/list?type=${this.state.type}`,
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

  getNoticeList(page = 1, check = false) {
    if (globalData.account) {
      wx.showLoading({ title: "获取中" });

      ensureActionLogin(globalData.account, check).then((err) => {
        if (err) {
          wx.hideLoading();
          showToast(err.msg);
          this.setData({ status: "error" });
        } else
          getNoticeList({
            page,
            type: this.state.type,
          }).then((res) => {
            wx.hideLoading();
            this.state.inited = true;
            if (res.success) {
              this.setData({
                scrollTop: 0,
                notices: res.data,
                page,
                currentPage: res.pageIndex,
                totalPage: res.totalPage,
                status: "success",
              });
            } else this.setData({ status: "error" });
          });
      });
    } else this.setData({ status: "login" });
  },

  retry() {
    this.getNoticeList(1, true);
  },

  prevPage() {
    this.getNoticeList(this.data.currentPage - 1);
  },

  nextPage() {
    this.getNoticeList(this.data.currentPage + 1);
  },

  changePage({ detail }: WechatMiniprogram.PickerChange) {
    this.getNoticeList(Number(detail.value) + 1);
  },

  viewNotice({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { title, id } = this.data.notices[index];
    const { type } = this.state;

    this.$go(
      `notice-detail?from=${this.data.title}&title=${title}&id=${id}&type=${type}`,
    );
  },
});

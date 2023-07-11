import { $Page } from "@mptool/enhance";

import { getNoticeList } from "./api.js";
import { type NoticeItem } from "./typings.js";
import { getActionCookie } from "../../api/action.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { getColor } from "../../utils/page.js";

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
      title: `学校${type === "news" ? "新闻" : "通知"}`,
    });
  },

  onShow() {
    if (!this.state.inited) this.getNoticeList(1, true);
    else if (globalData.account) {
      if (this.data.status === "login") this.getNoticeList(1, true);
    } else this.setData({ status: "login" });
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

      getActionCookie(globalData.account, check).then((res) => {
        if (res.success)
          getNoticeList({
            cookies: res.cookies,
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
        else {
          wx.hideLoading();
          this.setData({ status: "error" });
        }
      });
    } else this.setData({ status: "login" });
  },

  prevPage() {
    this.getNoticeList(this.data.currentPage - 1);
  },

  nextPage() {
    this.getNoticeList(this.data.currentPage + 1);
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
      `notice-detail?from=学校通知&title=${title}&id=${id}&type=${type}`,
    );
  },
});

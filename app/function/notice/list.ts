import { $Page } from "@mptool/all";

import { showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import type { NoticeItem } from "../../service/index.js";
import { getNoticeList, getOnlineNoticeList } from "../../service/index.js";
import { ensureActionLogin } from "../../service/index.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

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
    loginMethod: <"check" | "login" | "validate">"validate",
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
    if (globalData.account) {
      if (this.data.status === "login" || !this.state.inited)
        this.getNoticeList(1);
    } else {
      this.setData({ status: "login" });
    }

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

  async getNoticeList(page = 1) {
    if (globalData.account) {
      wx.showLoading({ title: "获取中" });

      const err = await ensureActionLogin(
        globalData.account,
        this.state.loginMethod,
      );

      if (err) {
        wx.hideLoading();
        showToast(err.msg);
        this.state.loginMethod = "login";

        return this.setData({ status: "error" });
      }

      const result = await (useOnlineService(PAGE_ID)
        ? getOnlineNoticeList
        : getNoticeList)({
        page,
        type: this.state.type,
      });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        this.setData({
          scrollTop: 0,
          notices: result.data,
          page,
          currentPage: result.pageIndex,
          totalPage: result.totalPage,
          status: "success",
        });
        this.state.loginMethod = "check";
      } else {
        this.setData({ status: "error" });
        this.state.loginMethod = "login";
      }
    } else {
      this.setData({ status: "login" });
    }
  },

  retry() {
    return this.getNoticeList(1);
  },

  prevPage() {
    return this.getNoticeList(this.data.currentPage - 1);
  },

  nextPage() {
    return this.getNoticeList(this.data.currentPage + 1);
  },

  changePage({ detail }: WechatMiniprogram.PickerChange) {
    return this.getNoticeList(Number(detail.value) + 1);
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

    return this.$go(
      `notice-detail?from=${this.data.title}&title=${title}&id=${id}&type=${type}`,
    );
  },
});

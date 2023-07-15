import { $Page } from "@mptool/all";

import { getInfoList } from "./api.js";
import { type InfoItem, type MainInfoType } from "./typings.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { getColor } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const type2Title = {
  news: "学校新闻",
  notice: "学校通知",
  academic: "学术会议",
};

const PAGE_ID = "news-list";

$Page(PAGE_ID, {
  data: {
    title: "",

    theme: globalData.theme,

    status: <"error" | "success">"success",
    items: <InfoItem[]>[],
    currentPage: 1,
    totalPage: 1,
  },

  state: {
    type: <MainInfoType>"notice",
  },

  onLoad({ type = "notice" }) {
    this.state.type = <MainInfoType>type;
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      title: type2Title[<MainInfoType>type],
    });
    this.getInfoList(1);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.title,
      path: `/function/info/list?type=${this.state.type}`,
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

  getInfoList(page = 1) {
    wx.showLoading({ title: "获取中" });

    return getInfoList({
      page,
      type: this.state.type,
      totalPage: this.data.totalPage,
    }).then((res) => {
      wx.hideLoading();

      if (res.success) {
        this.setData({
          scrollTop: 0,
          items: res.data,
          page,
          currentPage: res.page,
          totalPage: res.totalPage,
          status: "success",
        });
      } else this.setData({ status: "error" });
    });
  },

  retry() {
    this.getInfoList(1);
  },

  prevPage() {
    this.getInfoList(this.data.currentPage - 1);
  },

  nextPage() {
    this.getInfoList(this.data.currentPage + 1);
  },

  changePage({ detail }: WechatMiniprogram.PickerChange) {
    this.getInfoList(Number(detail.value) + 1);
  },

  viewItem({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { title, url } = this.data.items[index];
    const { type } = this.state;

    this.$go(
      `info-detail?from=${this.data.title}&title=${title}&type=${type}&url=${url}`,
    );
  },
});

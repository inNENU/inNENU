import { $Page } from "@mptool/all";

import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor, popNotice } from "../../utils/page.js";
import type { InfoItem, MainInfoType } from "../../widgets/info/list.js";
import { getInfoList, getOnlineInfoList } from "../../widgets/info/list.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const type2Title = {
  news: "学校新闻",
  notice: "学校通知",
  academic: "学术会议",
};

const PAGE_ID = "info-list";

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

  onShow() {
    popNotice(PAGE_ID);
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

  async getInfoList(page = 1) {
    wx.showLoading({ title: "获取中" });

    const result = await (useOnlineService(PAGE_ID)
      ? getOnlineInfoList
      : getInfoList)({
      page,
      type: this.state.type,
      totalPage: this.data.totalPage,
    });

    wx.hideLoading();

    if (result.success)
      this.setData({
        scrollTop: 0,
        items: result.data,
        page,
        currentPage: result.page,
        totalPage: result.totalPage,
        status: "success",
      });
    else this.setData({ status: "error" });
  },

  retry() {
    return this.getInfoList(1);
  },

  prevPage() {
    return this.getInfoList(this.data.currentPage - 1);
  },

  nextPage() {
    return this.getInfoList(this.data.currentPage + 1);
  },

  changePage({ detail }: WechatMiniprogram.PickerChange) {
    return this.getInfoList(Number(detail.value) + 1);
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

    return this.$go(
      `info-detail?from=${this.data.title}&title=${title}&type=${type}&url=${url}`,
    );
  },
});

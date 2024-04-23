import { $Page } from "@mptool/all";

import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import type { AcademicInfoItem } from "../../service/index.js";
import { getAcademicList, getOnlineAcademicList } from "../../service/index.js";
import { info } from "../../state/info.js";
import { getColor, popNotice } from "../../utils/page.js";

const { useOnlineService } = getApp<AppOption>();

const PAGE_ID = "info-list";
const PAGE_TITLE = "学术预告";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    theme: info.theme,

    status: "success" as "error" | "success",
    items: [] as AcademicInfoItem[],
    currentPage: 1,
    totalPage: 1,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: info.theme,
    });
    this.getAcademicList(1);
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: PAGE_TITLE,
      path: `/function/academic/list`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return { title: PAGE_TITLE };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: PAGE_TITLE,
      imageUrl: `${appCoverPrefix}.jpg`,
    };
  },

  async getAcademicList(page = 1) {
    wx.showLoading({ title: "获取中" });

    const result = await (
      useOnlineService(PAGE_ID) ? getOnlineAcademicList : getAcademicList
    )({
      page,
      totalPage: this.data.totalPage,
    });

    wx.hideLoading();

    if (result.success) {
      this.setData({
        items: result.data,
        page,
        currentPage: result.page,
        totalPage: result.totalPage,
        status: "success",
      });
      wx.pageScrollTo({ scrollTop: 0 });
    } else {
      this.setData({ status: "error" });
    }
  },

  retry() {
    return this.getAcademicList(1);
  },

  prevPage() {
    return this.getAcademicList(this.data.currentPage - 1);
  },

  nextPage() {
    return this.getAcademicList(this.data.currentPage + 1);
  },

  changePage({ detail }: WechatMiniprogram.PickerChange) {
    return this.getAcademicList(Number(detail.value) + 1);
  },

  viewItem({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { subject, url, person } = this.data.items[index];

    return this.$go(
      `academic-detail?from=${this.data.title}&title=${subject}&person=${person}&url=${url}`,
    );
  },
});

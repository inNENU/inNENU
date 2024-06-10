import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../config/index.js";
import type { AnnouncementInfoItem } from "../../service/index.js";
import { getAnnouncementList } from "../../service/index.js";
import { info } from "../../state/index.js";
import { getPageColor, showNotice } from "../../utils/index.js";

const PAGE_ID = "info-list";
const PAGE_TITLE = "通知公告";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    theme: info.theme,

    status: "success" as "error" | "success",
    items: [] as AnnouncementInfoItem[],
    currentPage: 1,
    totalPage: 1,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });
    this.getAnnouncementList(1);
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: PAGE_TITLE,
      path: `/function/announcement/list`,
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

  async getAnnouncementList(page = 1) {
    wx.showLoading({ title: "获取中" });

    const result = await getAnnouncementList({
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
    return this.getAnnouncementList(1);
  },

  prevPage() {
    return this.getAnnouncementList(this.data.currentPage - 1);
  },

  nextPage() {
    return this.getAnnouncementList(this.data.currentPage + 1);
  },

  changePage({ detail }: WechatMiniprogram.PickerChange) {
    return this.getAnnouncementList(Number(detail.value) + 1);
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

    return this.$go(
      `announcement-detail?from=${this.data.title}&title=${title}&url=${url}`,
    );
  },
});

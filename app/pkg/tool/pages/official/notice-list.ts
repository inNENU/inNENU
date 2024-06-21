import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { OfficialNoticeInfoItem } from "../../../../service/index.js";
import { getOfficialNoticeList } from "../../../../service/index.js";
import { info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "official-notice-list";
const PAGE_TITLE = "通知公告";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    theme: info.theme,

    status: "success" as "error" | "success",
    items: [] as OfficialNoticeInfoItem[],
    current: 1,
    total: 1,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });
    this.getOfficialNoticeList(1);
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: PAGE_TITLE,
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

  async getOfficialNoticeList(current = 1) {
    wx.showLoading({ title: "获取中" });

    const result = await getOfficialNoticeList({
      current,
      total: this.data.total,
    });

    wx.hideLoading();

    if (result.success) {
      this.setData({
        items: result.data,
        current: result.current,
        total: result.total,
        status: "success",
      });
      wx.pageScrollTo({ scrollTop: 0 });
    } else {
      this.setData({ status: "error" });
    }
  },

  retry() {
    return this.getOfficialNoticeList(1);
  },

  changePage({ detail }: WechatMiniprogram.CustomEvent<{ current: number }>) {
    return this.getOfficialNoticeList(detail.current);
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
      `official-notice-detail?from=${this.data.title}&title=${title}&url=${url}`,
    );
  },
});

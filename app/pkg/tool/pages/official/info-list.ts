import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { InfoItem, InfoType } from "../../../../service/index.js";
import { getInfoList } from "../../../../service/index.js";
import { info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import { getOfficialTitle } from "../../utils/index.js";

const PAGE_ID = "official-info-list";

$Page(PAGE_ID, {
  data: {
    title: "",

    theme: info.theme,

    status: "success" as "error" | "success",
    items: [] as InfoItem[],
    currentPage: 1,
    totalPage: 1,
  },

  state: {
    type: "news" as InfoType,
  },

  onLoad({ type = "news" }) {
    this.state.type = type as InfoType;
    this.setData({
      color: getPageColor(),
      theme: info.theme,
      title: getOfficialTitle(type as InfoType),
    });
    this.getInfoList(1);
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.title,
      path: `/pkg/tool/pages/official/info-list?type=${this.state.type}`,
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

    const result = await getInfoList({
      page,
      type: this.state.type,
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
    return this.getInfoList(1);
  },

  changePage({ detail }: WechatMiniprogram.CustomEvent<{ current: number }>) {
    return this.getInfoList(detail.current);
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
      `official-info-detail?from=${this.data.title}&title=${title}&type=${type}&url=${url}`,
    );
  },
});
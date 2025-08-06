import { $Page, showToast } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { ContentSearchHit } from "../../../../service/index.js";
import { getSuggestions, searchContent } from "../../../../service/index.js";
import { appInfo, info, windowInfo } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";

$Page("search", {
  data: {
    theme: info.theme,

    /** 搜索结果 */
    results: [] as ContentSearchHit[],

    /** 搜索结果总数 */
    total: 0,

    /** 当前页码 */
    current: 1,

    /** 总页数 */
    totalPages: 0,

    /** 当前搜索词 */
    query: "",

    /** 是否正在搜索 */
    searching: false,

    /** 是否显示建议的搜索结果（默认搜索） */
    showDefaultResults: false,
  },

  state: {
    /** 搜索框中的内容 */
    query: "",
  },

  onLoad(options) {
    this.setData({
      color: getPageColor(true),
      query: options.query || "",
      theme: info.theme,
      darkmode: appInfo.darkmode,
    });

    if (options.query) this.search({ detail: { value: options.query } });
    this.getSuggestions();
    showNotice("search");
  },

  onPageScroll(options) {
    this.setData({
      showBackToTop: options.scrollTop > 250 + windowInfo.statusBarHeight,
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { query } = this.state;

    return {
      title: `搜索${query ? `: ${query}` : ""}`,
      path: `/pkg/addon/pages/search/search?query=${query}`,
      imageUrl: `${appCoverPrefix}Share.png`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { query } = this.state;

    return {
      title: `搜索${query ? `: ${query}` : ""}`,
      query: `query=${query}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { query } = this.state;

    return {
      title: `搜索${query ? `: ${query}` : ""}`,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `query=${query}`,
    };
  },

  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0 });
  },

  async getSuggestions() {
    this.setData({
      suggestions: await getSuggestions(),
    });
  },

  /**
   * 搜索建议点击事件
   */
  searchSuggestion(event: WechatMiniprogram.Touch) {
    const { query } = event.currentTarget.dataset as { query: string };

    this.setData({ query: query });
    this.search({ detail: { value: query } }, 1);
  },

  /**
   * 进行搜索
   *
   * @param searchEvent 搜索事件
   * @param page 页码，如果不提供则重置到第一页
   */
  async search(
    { detail: { value } }: { detail: { value: string } },
    page?: number,
  ) {
    const current = page ?? 1;

    // 如果搜索词为空，显示默认搜索结果
    if (!value.trim()) {
      this.setData({ query: "", searchWord: "" });
      this.state.query = "";

      return;
    }

    this.setData({
      searching: true,
      query: value,
      showDefaultResults: false,
    });

    wx.showLoading({ title: "搜索中..." });

    try {
      const { results, total, totalPages } = await searchContent(
        value,
        current,
      );

      wx.hideLoading();

      this.setData({
        results,
        total,
        current,
        totalPages,
        searching: false,
      });
      this.state.query = value;
    } catch (error) {
      console.error("搜索失败:", error);

      wx.hideLoading();
      showToast("搜索失败，请重试", 1000, "error");

      this.setData({
        results: [],
        total: 0,
        current: 1,
        totalPages: 0,
        searching: false,
      });
    }
  },

  /**
   * 分页改变事件
   */
  changePage({ detail }: { detail: { current: number } }) {
    const { current } = detail;
    const { query } = this.state;

    // 滚动到顶部
    wx.pageScrollTo({ scrollTop: 0 });

    if (query) {
      // 有搜索词时，执行搜索
      this.search({ detail: { value: query } }, current);
    }
  },
});

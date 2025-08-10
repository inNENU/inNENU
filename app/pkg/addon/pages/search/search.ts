import { $Page, showToast } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { ContentSearchHit } from "../../../../service/index.js";
import { getSuggestions, searchContent } from "../../../../service/index.js";
import { info, windowInfo } from "../../../../state/index.js";
import {
  getIconLink,
  getPageColor,
  showNotice,
} from "../../../../utils/index.js";
import { searchPage } from "../../utils/search.js";

$Page("search", {
  data: {
    theme: info.theme,

    /** 搜索结果 */
    contentResults: [] as ContentSearchHit[],

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

  onLoad({ query = "" }) {
    this.setData({
      color: getPageColor(true),
      query,
      theme: info.theme,
    });

    if (query) {
      this.searchPage(query);
      this.searchContent(query);
    }
    this.getSuggestions();
    showNotice("search");
  },

  onScrollViewScroll(options: WechatMiniprogram.ScrollViewScroll) {
    this.setData({
      showBackToTop:
        options.detail.scrollTop > 250 + windowInfo.statusBarHeight,
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

  onSearch(event: WechatMiniprogram.InputConfirm) {
    const query = event.detail.value;

    this.searchContent(query);
    this.searchPage(query);
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
    this.searchContent(query, 1);
  },

  async searchContent(query: string, page?: number) {
    const current = page ?? 1;

    // 如果搜索词为空，显示默认搜索结果
    if (!query.trim()) {
      this.setData({ query: "", searchWord: "" });
      this.state.query = "";

      return;
    }

    this.setData({
      searching: true,
      query,
      showDefaultResults: false,
    });

    wx.showLoading({ title: "搜索中..." });

    try {
      const { results, total, totalPages } = await searchContent(
        query,
        current,
      );

      wx.hideLoading();

      this.setData({
        contentResults: results,
        total,
        current,
        totalPages,
        searching: false,
      });
      this.state.query = query;
    } catch (error) {
      console.error("搜索失败:", error);

      wx.hideLoading();
      showToast("搜索失败，请重试", 1000, "error");

      this.setData({
        contentResults: [],
        total: 0,
        current: 1,
        totalPages: 0,
        searching: false,
      });
    }
  },

  async searchPage(query: string) {
    const pageResults = await searchPage(query);

    this.setData({
      icons: Object.fromEntries(
        pageResults.map(({ icon }) => [icon, getIconLink(icon)]),
      ),
      pageResults,
    });
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
      this.searchContent(query, current);
    }
  },
});

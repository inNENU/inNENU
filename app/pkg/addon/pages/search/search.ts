import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { PageSearchHit } from "../../../../service/index.js";
import { meiliSearch } from "../../../../service/index.js";
import { appInfo, info, windowInfo } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";

$Page("search", {
  data: {
    theme: info.theme,

    /** 搜索结果 */
    results: [] as PageSearchHit[],

    /** 搜索结果总数 */
    total: 0,

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
    if (options.query) {
      this.search({ detail: { value: options.query } });
    } else {
      // 执行默认搜索以获取推荐内容
      // this.performDefaultSearch();
    }

    this.setData({
      color: getPageColor(true),
      query: options.query || "",
      theme: info.theme,
      darkmode: appInfo.darkmode,
    });

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

  /**
   * 搜索建议点击事件
   */
  searchSuggestion(event: WechatMiniprogram.Touch) {
    const { query } = event.currentTarget.dataset as { query: string };

    this.setData({ query: query });
    this.search({ detail: { value: query } });
  },

  /**
   * 执行默认搜索，显示推荐内容
   */
  async performDefaultSearch() {
    try {
      this.setData({ searching: true });

      // 使用空字符串触发 MeiliSearch 的默认模式
      const { results, total } = await meiliSearch("");

      this.setData({
        results,
        total,
        searching: false,
        showDefaultResults: true,
      });
    } catch (error) {
      console.error("获取默认搜索结果失败:", error);
      this.setData({
        results: [],
        total: 0,
        searching: false,
        showDefaultResults: false,
      });
    }
  },

  /**
   * 进行搜索
   *
   * @param value 搜索词
   */
  async search({ detail: { value } }: { detail: { value: string } }) {
    // 如果搜索词为空，显示默认搜索结果
    if (!value.trim()) {
      await this.performDefaultSearch();
      this.setData({ query: "" });
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
      const { results, total } = await meiliSearch(value);

      this.setData({
        results,
        total,
        searching: false,
      });
      this.state.query = value;
    } catch (error) {
      console.error("搜索失败:", error);
      wx.showToast({
        title: "搜索失败，请重试",
        icon: "error",
      });
      this.setData({
        results: [],
        total: 0,
        searching: false,
      });
    } finally {
      wx.hideLoading();
    }
  },
});

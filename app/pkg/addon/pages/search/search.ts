import { $Page } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import type { SearchResult, SearchType } from "../../../../service/index.js";
import { searchMiniApp } from "../../../../service/index.js";
import { appInfo, info, windowInfo } from "../../../../state/index.js";
import {
  getIconLink,
  getPageColor,
  showNotice,
} from "../../../../utils/index.js";

$Page("search", {
  data: {
    theme: info.theme,

    /** 搜索类别 */
    type: "all" as SearchType,

    /** 候选词 */
    words: [] as string[],

    /** 搜索结果 */
    result: [] as SearchResult[],
  },

  state: {
    /** 是否正在输入 */
    typing: false,
    /** 搜索框中的内容 */
    query: "",
  },

  onLoad(options) {
    if (options.word) this.search({ detail: { value: options.word } });

    this.setData({
      type: (options.type as SearchType) || "all",
      color: getPageColor(true),
      searchWord: options.word || "",
      theme: info.theme,
      darkmode: appInfo.darkmode,
    });

    showNotice("search");
  },

  onPageScroll(options) {
    if (options.scrollTop > 250 + windowInfo.statusBarHeight)
      this.setData({ showBackToTop: true });
    else this.setData({ showBackToTop: false });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { query } = this.state;

    return {
      title: `搜索${query ? `: ${query}` : ""}`,
      path: `/pkg/addon/pages/search/search?type=${this.data.type}&word=${query}`,
      imageUrl: `${appCoverPrefix}Share.png`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { query } = this.state;

    return {
      title: `搜索${query ? `: ${query}` : ""}`,
      query: `type=${this.data.type}&word=${query}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { query } = this.state;

    return {
      title: `搜索${query ? `: ${query}` : ""}`,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${this.data.type}&word=${query}`,
    };
  },

  changeSearchType({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { type: SearchType }
  >) {
    const { query } = this.state;

    this.setData({ type: currentTarget.dataset.type });
    if (query) this.search({ detail: { value: query } });
  },

  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0 });
  },

  /**
   * 在搜索框中输入时触发的函数
   *
   * @param value 输入的搜索词
   */
  async searching({ detail: { value } }: WechatMiniprogram.Input) {
    this.state.typing = true;

    const words = await searchMiniApp<string[]>({
      word: value,
      scope: this.data.type,
      type: "word",
    });

    if (this.state.typing) this.setData({ words });
  },

  /**
   * 进行搜索
   *
   * @param value 搜索词
   */
  async search({ detail: { value } }: { detail: { value: string } }) {
    this.state.typing = false;
    this.setData({ words: [] });
    wx.showLoading({ title: "搜索中..." });

    const result = await searchMiniApp<SearchResult[]>({
      word: value,
      scope: this.data.type,
      type: "result",
    });

    this.setData({
      result,
      icons: Object.fromEntries(
        result
          .map(({ icon }) => (icon ? [icon, getIconLink(icon)] : null))
          .filter((item): item is [string, string] => item !== null),
      ),
    });
    this.state.query = value;
    wx.hideLoading();
  },
});

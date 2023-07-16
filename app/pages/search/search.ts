import { $Page } from "@mptool/all";

import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor, popNotice } from "../../utils/page.js";
import { SearchResult, search } from "../../utils/search.js";

const { globalData } = getApp<AppOption>();

$Page("search", {
  data: {
    theme: globalData.theme,

    /** 状态栏高度 */
    statusBarHeight: globalData.info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    /** 搜索结果 */
    result: <SearchResult[]>[],

    /** 搜索词 */
    searchWord: "",
  },

  state: {
    /** 分类 */
    name: <"all" | "guide" | "intro">"all",
    /** 是否正在输入 */
    typing: false,
    /** 搜索框中的内容 */
    value: "",
  },

  onLoad(options) {
    if (options.name)
      this.state.name = options.name as "all" | "guide" | "intro";
    if (options.word) this.search({ detail: { value: options.word } });

    this.setData({
      firstPage: getCurrentPages().length === 1,
      color: getColor(true),
      searchWord: options.word || "",
      theme: globalData.theme,
      darkmode: globalData.darkmode,
    });

    popNotice("search");
  },

  onPageScroll(options) {
    if (options.scrollTop > 250 + globalData.info.statusBarHeight)
      this.setData({ showBackToTop: true });
    else this.setData({ showBackToTop: false });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: "搜索",
      path: `/pages/search/search?name=${this.state.name}&word=${this.state.value}`,
      imageUrl: `${appCoverPrefix}Share.png`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: "搜索",
      query: `name=${this.state.name}&word=${this.state.value}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: "搜索",
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `name=${this.state.name}&word=${this.state.value}`,
    };
  },

  /**
   * 在搜索框中输入时触发的函数
   *
   * @param value 输入的搜索词
   */
  async searching({ detail: { value } }: WechatMiniprogram.Input) {
    this.state.typing = true;

    const words = await search<string[]>({
      word: value,
      scope: this.state.name,
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

    const result = await search<SearchResult[]>({
      word: value,
      scope: this.state.name,
      type: "result",
    });

    this.setData({ result });
    this.state.value = value;
    wx.hideLoading();
  },

  scrollTop() {
    wx.pageScrollTo({ scrollTop: 0 });
  },
});

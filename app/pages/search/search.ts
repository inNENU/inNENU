import { $Page, readFile } from "@mptool/all";

import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor, popNotice } from "../../utils/page.js";
import type { SearchResult, SearchType } from "../../utils/search.js";
import { search } from "../../utils/search.js";

const { globalData } = getApp<AppOption>();

$Page("search", {
  data: {
    theme: globalData.theme,

    /** 搜索类别 */
    type: <SearchType>"all",

    /** 状态栏高度 */
    statusBarHeight: globalData.info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    /** 搜索结果 */
    result: <SearchResult[]>[],
  },

  state: {
    /** 是否正在输入 */
    typing: false,
    /** 搜索框中的内容 */
    value: "",
  },

  onLoad(options) {
    if (options.word) this.search({ detail: { value: options.word } });

    this.setData({
      type: <SearchType>options.type || "all",
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
      path: `/pages/search/search?type=${this.data.type}&word=${this.state.value}`,
      imageUrl: `${appCoverPrefix}Share.png`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: "搜索",
      query: `type=${this.data.type}&word=${this.state.value}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: "搜索",
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${this.data.type}&word=${this.state.value}`,
    };
  },

  changeSearchType({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { type: SearchType }
  >) {
    const { value } = this.state;

    this.setData({ type: currentTarget.dataset.type });
    if (value)
      this.search({
        detail: { value },
      });
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

    const words = await search<string[]>({
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

    const result = await search<SearchResult[]>({
      word: value,
      scope: this.data.type,
      type: "result",
    });

    this.setData({
      result,
      icons: Object.fromEntries(
        result
          .filter((item) => item.icon && !item.icon.includes("/"))
          .map((item) => [item.icon!, readFile(`icon/${item.icon!}`) || ""]),
      ),
    });
    this.state.value = value;
    wx.hideLoading();
  },
});

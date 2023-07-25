import { $Page, get, put, set, take } from "@mptool/all";

import type { PageDataWithContent } from "../../../typings/index.js";
import { requestJSON } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix, appName } from "../../config/index.js";
import { DAY } from "../../utils/constant.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { search } from "../../utils/search.js";
import { getIdentity } from "../../utils/settings.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "main";

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    statusBarHeight: globalData.info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    page: <PageDataWithContent>{
      title: "首页",
      grey: true,
      hidden: true,
      content: [{ tag: "loading" }],
    },

    menuSpace: globalData.env === "app" ? 10 : 90,
  },

  onRegister() {
    const page = resolvePage(
      { id: PAGE_ID },
      get<PageDataWithContent>(PAGE_ID) || this.data.page,
    ) as PageDataWithContent;

    put(PAGE_ID, page);

    if (page) this.data.page = page;

    console.debug(
      "Main page registered: ",
      new Date().getTime() - globalData.startupTime,
      "ms",
    );
  },

  onLoad() {
    setPage(
      {
        option: { id: PAGE_ID },
        ctx: this,
        handle: true,
      },
      take<PageDataWithContent>(PAGE_ID) || this.data.page,
    );

    this.$on("data", () => this.setPage());
  },

  async onShow() {
    this.setData({
      login: Boolean(globalData.account),
    });

    popNotice(PAGE_ID);

    await this.setPage();
  },

  onReady() {
    // 注册事件监听器
    this.$on("theme", this.setTheme);

    // 执行 tab 页预加载
    ["function", "guide", "intro", "user"].forEach((item) => {
      this.$preload(item);
    });
  },

  async onPullDownRefresh() {
    await this.setPage();
    checkResource();
    wx.stopPullDownRefresh();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: appName,
    path: "/pages/main/main",
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({
    title: appName,
  }),

  onAddToFavorites: () => ({
    title: appName,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onUnload() {
    this.$off("theme", this.setTheme);
  },

  setTheme(theme: string): void {
    this.setData({ color: getColor(this.data.page.grey), theme });
  },

  async loadPage(): Promise<PageDataWithContent | null> {
    const test = wx.getStorageSync<boolean | undefined>("test");

    if (test)
      return await requestJSON<PageDataWithContent>(
        `d/config/${globalData.appID}/test/main`,
      );

    if (!globalData.data) return null;

    const identify = getIdentity(globalData.account);
    const { "main-page": mainConfig, "main-presets": mainPresets } =
      globalData.data;

    const configName = mainConfig[identify] || mainConfig.default;

    const mainPage = {
      title: "首页",
      grey: true,
      hidden: true,
      content: mainPresets[configName],
    };

    set(PAGE_ID, mainPage, 3 * DAY);

    return mainPage;
  },

  async setPage(): Promise<void> {
    try {
      const pageData = await this.loadPage();

      if (pageData) setPage({ ctx: this, option: { id: PAGE_ID } }, pageData);
    } catch (err) {
      setPage(
        { ctx: this, option: { id: PAGE_ID } },
        get(PAGE_ID) || this.data.page,
      );
    }
  },

  /**
   * 在搜索框中输入时触发的函数
   *
   * @param value 输入的搜索词
   */
  async searching({ detail: { value } }: WechatMiniprogram.Input) {
    const words = await search<string[]>({
      scope: "all",
      type: "word",
      word: value,
    });

    this.setData({ words });
  },

  /**
   * 跳转到搜索页面
   *
   * @param value 输入的搜索词
   */
  search({ detail }: WechatMiniprogram.Input) {
    this.$go(`search?name=all&word=${detail.value}`);
  },
});

import { $Page, get, set } from "@mptool/all";

import type { PageDataWithContent } from "../../../typings/index.js";
import type { AppOption } from "../../app.js";
import { WIDGET_KEY, appCoverPrefix, appName } from "../../config/index.js";
import { DAY } from "../../config/index.js";
import { getColor, popNotice, resolvePage, setPage } from "../../utils/page.js";
import { checkResource } from "../../utils/resource.js";
import { search } from "../../utils/search.js";
import { getIdentity } from "../../utils/settings.js";
import { DEFAULT_WIDGETS } from "../../widgets/config.js";
import { WidgetConfig } from "../../widgets/utils.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "main";

const defaultPage = <PageDataWithContent>resolvePage(
  { id: PAGE_ID },
  get<PageDataWithContent>(PAGE_ID) ||
    <PageDataWithContent>{
      title: "首页",
      grey: true,
      hidden: true,
      content: [{ tag: "loading" }],
    },
);

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    statusBarHeight: globalData.info.statusBarHeight,

    /** 候选词 */
    words: <string[]>[],

    page: defaultPage,

    menuSpace: globalData.env === "app" ? 10 : 90,
  },

  onLoad() {
    setPage(
      {
        option: { id: PAGE_ID },
        ctx: this,
        handle: true,
      },
      this.data.page,
    );

    this.$on("data", () => this.setPage());
  },

  onShow() {
    const widgets = get<WidgetConfig[]>(WIDGET_KEY) || DEFAULT_WIDGETS;

    this.setData({
      login: Boolean(globalData.account),
      widgets,
    });

    popNotice(PAGE_ID);

    this.setPage();
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
    this.setPage();
    await checkResource();
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

  loadPage(): PageDataWithContent | null {
    if (!globalData.settings) return null;

    const { id } = getIdentity(globalData.userInfo);
    const { "main-page": mainConfig, "main-presets": mainPresets } =
      globalData.settings;

    const configName = mainConfig[id] || mainConfig.default;

    const mainPage = {
      title: "首页",
      grey: true,
      hidden: true,
      content: mainPresets[configName],
    };

    set(PAGE_ID, mainPage, 3 * DAY);

    return mainPage;
  },

  setPage(): void {
    try {
      const pageData = this.loadPage();

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
    this.$go(`search?type=all&word=${detail.value}`);
  },
});

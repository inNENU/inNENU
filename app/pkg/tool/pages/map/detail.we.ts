import { $Page, readJSON } from "@mptool/all";

import type { PageState } from "../../../../../typings/index.js";
import type { App } from "../../../../app.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { defaultScroller } from "../../../../mixins/index.js";
import { windowInfo } from "../../../../state/index.js";
import {
  getJson,
  resolvePage,
  setPage,
  startNavigation,
} from "../../../../utils/index.js";

const { globalData } = getApp<App>();

$Page("map-detail", {
  data: {
    statusBarHeight: windowInfo.statusBarHeight,
    page: {} as PageState,
    loc: null as `${number},${number}` | null,
  },

  state: { id: "" },

  onPreload(options) {
    const { id } = options;

    resolvePage({ id }, readJSON(`function/map/${id}`));
  },

  onLoad(option) {
    const { id, loc } = option;

    if (id) {
      if (globalData.page.id === id) setPage({ option, ctx: this });
      else
        getJson<PageState>(`function/map/${id}`)
          .then((data) => {
            setPage({ option, ctx: this }, data);
          })
          .catch(() => {
            setPage({ option, ctx: this }, { error: true });
          });

      this.state.id = id;
    }

    this.setData({
      firstPage: getCurrentPages().length === 1,
      ...(loc ? { loc: loc as `${number},${number}` } : {}),
    });
  },

  onPageScroll(options) {
    // @ts-expect-error: data type is missing
    this.defaultScroller(options);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { page, loc } = this.data;

    return {
      title: page.title,
      path: `/pkg/tool/pages/map/detail?id=${this.state.id}${
        loc ? `&loc=${loc}` : ""
      }`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { page, loc } = this.data;

    return {
      title: page.title,
      query: `id=${this.state.id}${loc ? `&loc=${loc}` : ""}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { page, loc } = this.data;

    return {
      title: page.title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `id=${this.state.id}${loc ? `&loc=${loc}` : ""}`,
    };
  },

  defaultScroller,

  /** 开启导航 */
  navigate() {
    const { loc, page } = this.data;

    startNavigation({ name: page.title ?? "目的地", loc: loc! });
  },
});

import { $Page, readJSON } from "@mptool/all";

import type { PageState } from "../../../../../typings/index.js";
import type { App } from "../../../../app.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { defaultScroller } from "../../../../mixins/index.js";
import { windowInfo } from "../../../../state/index.js";
import { getJson, resolvePage, setPage } from "../../../../utils/index.js";

const { globalData } = getApp<App>();

$Page("map-detail", {
  data: {
    statusBarHeight: windowInfo.statusBarHeight,
    page: {} as PageState,
  },

  state: { id: "" },

  onPreload(options) {
    const { id } = options;

    resolvePage({ id }, readJSON(`function/map/${id}`));
  },

  onLoad(option) {
    const { id } = option;

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
    });
  },

  onPageScroll(options) {
    // @ts-expect-error: data type is missing
    this.defaultScroller(options);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { page } = this.data;

    return {
      title: page.title,
      path: `/pkg/tool/pages/map/detail?id=${this.state.id}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { page } = this.data;

    return {
      title: page.title,
      query: `id=${this.state.id}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { page } = this.data;

    return {
      title: page.title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `id=${this.state.id}`,
    };
  },

  defaultScroller,
});

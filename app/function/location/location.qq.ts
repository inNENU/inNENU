import { $Page, readJSON } from "@mptool/all";

import type { PageData } from "../../../typings/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { defaultScroller } from "../../mixins/index.js";
import { info } from "../../state/index.js";
import { getResource, resolvePage, setPage } from "../../utils/index.js";

const { globalData } = getApp<AppOption>();

$Page("location", {
  data: {
    page: {} as PageData,
    point: "",
  },

  state: { id: "" },

  onPreload(options) {
    const { id } = options;

    resolvePage({ id }, readJSON(`function/map/${id}`));
  },

  onLoad(option) {
    const { id, point = "" } = option;

    if (id) {
      if (globalData.page.id === id) setPage({ option, ctx: this });
      else
        getResource<PageData>(`function/map/${id}`)
          .then((data) => {
            setPage({ option, ctx: this }, data);
          })
          .catch(() => {
            setPage(
              { option, ctx: this },
              {
                error: true,
                statusBarHeight: info.statusBarHeight,
              },
            );
          });

      this.state.id = id;
    }

    this.setData({
      statusBarHeight: info.statusBarHeight,
      firstPage: getCurrentPages().length === 1,
      point,
    });
  },

  onPageScroll(options) {
    // @ts-expect-error: data type is missing
    this.defaultScroller(options);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { page, point } = this.data;

    return {
      title: page.title,
      path: `/function/map/location?id=${this.state.id}${
        point ? `&point=${point}` : ""
      }`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { page, point } = this.data;

    return {
      title: page.title,
      query: `id=${this.state.id}${point ? `&point=${point}` : ""}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { page, point } = this.data;

    return {
      title: page.title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `id=${this.state.id}${point ? `&point=${point}` : ""}`,
    };
  },

  defaultScroller,
});

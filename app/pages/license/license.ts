import { $Page } from "@mptool/all";

import type { PageData, PageOption } from "../../../typings/index.js";
import { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { loadOnlinePage } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "license";

$Page(PAGE_ID, {
  data: {
    page: <PageData & { version: number }>{},
  },

  onLoad({
    type = "privacy",
    ...options
  }: PageOption & { type?: "license" | "privacy" }) {
    console.info("onLoad options: ", options);

    loadOnlinePage(
      { path: `config/${globalData.appID}/${type}`, ...options },
      this,
    );
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.page.title,
      path: "/pages/privacy/detail",
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.page.title,
      query: `path=${this.data.page.id}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.page.title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `path=${this.data.page.id}`,
    };
  },
});

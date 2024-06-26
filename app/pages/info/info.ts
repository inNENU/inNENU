import { $Page } from "@mptool/all";

import type { PageOptions, PageState } from "../../../typings/index.js";
import { appCoverPrefix } from "../../config/index.js";
import {
  id2path,
  loadOnlinePage,
  resolvePage,
  setOnlinePage,
} from "../../utils/index.js";

$Page("info", {
  data: {
    page: {} as PageState & { id: string },
  },

  onNavigate(option) {
    resolvePage(option);
  },

  onLoad(option: PageOptions & { path?: string }) {
    console.info("onLoad options: ", option);

    if (option.path) {
      loadOnlinePage(option as PageOptions & { path: string }, this);
    } else {
      // 生成页面 ID
      option.id = id2path(
        option.scene ? decodeURIComponent(option.scene) : option.id,
      );
      setOnlinePage(option, this);
    }

    wx.reportEvent?.("page_id", { id: option.id });
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.page.title,
      path: `/pages/info/info?path=${this.data.page.id}`,
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

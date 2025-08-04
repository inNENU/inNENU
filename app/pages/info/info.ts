import { $Page, logger } from "@mptool/all";

import type { PageOptions, PageState } from "../../../typings/index.js";
import { preloadSkyline } from "../../api/index.js";
import { appCoverPrefix } from "../../config/index.js";
import { windowInfo } from "../../state/index.js";
import {
  id2path,
  loadOnlinePage,
  resolvePage,
  setOnlinePage,
} from "../../utils/index.js";

$Page("info", {
  data: {
    statusBarHeight: windowInfo.statusBarHeight,
    page: {} as PageState & { id: string },
  },

  onNavigate(option) {
    resolvePage(option);
  },

  onLoad(option: PageOptions & { path?: string }) {
    logger.debug("onLoad options: ", option);

    if (option.path) {
      loadOnlinePage(option as PageOptions & { path: string }, this);
    } else {
      // 生成页面 ID
      option.id = id2path(
        option.scene ? decodeURIComponent(option.scene) : option.id,
      );
      setOnlinePage(option, this);
    }

    // FIXME: Replace it with custom report service
    // wx.reportEvent?.("page_id", { id: option.id });
  },

  onReady() {
    preloadSkyline();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { title, id } = this.data.page;

    return {
      title,
      path: `/pages/info/info?path=${id}`,
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

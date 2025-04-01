import type { RichTextNode } from "@mptool/all";
import { $Page } from "@mptool/all";

import { requestJSON } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { appId, info } from "../../../../state/index.js";
import { getPageColor } from "../../../../utils/index.js";

const PAGE_ID = "license";

$Page(PAGE_ID, {
  data: {
    title: "",
    type: "",
  },

  onLoad({
    from = "返回",
    type = "privacy",
  }: {
    type?: "license" | "privacy";
    from?: string;
  }) {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });

    return requestJSON<{
      title: string;
      version: number;
      nodes: RichTextNode[];
    }>(`config/${appId}/${type}-data`).then((data) => {
      this.setData({ ...data, from, type });
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.title,
      path: `/pkg/addon/pages/license/license?type=${this.data.type}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    return {
      title: this.data.title,
      query: `type=${this.data.type}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    return {
      title: this.data.title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${this.data.type}`,
    };
  },
});

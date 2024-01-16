import type { RichTextNode } from "@mptool/all";
import { $Page } from "@mptool/all";

import { requestJSON } from "../../api/index.js";
import { appCoverPrefix } from "../../config/info.js";
import { info } from "../../state/info.js";
import { getColor } from "../../utils/page.js";

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
      color: getColor(),
      theme: info.theme,
    });

    return requestJSON<{
      title: string;
      version: number;
      nodes: RichTextNode[];
    }>(`d/config/${info.appID}/${type}-data`).then((data) => {
      this.setData({ ...data, from, type });
    });
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    return {
      title: this.data.title,
      path: `/pages/license/license?type=${this.data.type}`,
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

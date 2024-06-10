import { $Page, get, set } from "@mptool/all";

import { getTitle } from "./utils.js";
import { showModal, showToast } from "../../api/index.js";
import {
  STARRED_INFO_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../config/index.js";
import type { InfoType } from "../../service/index.js";
import { getInfo } from "../../service/index.js";
import { appID, info } from "../../state/index.js";
import { getPageColor, showNotice } from "../../utils/index.js";
import type { StarredInfo } from "../../widgets/star/typings.js";

const PAGE_ID = "info-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "详情",
    starred: false,
    status: "success" as "error" | "login" | "success",
  },

  state: {
    url: "",
    title: "",
    type: "news" as InfoType,
    info: null as StarredInfo | null,
  },

  onLoad({
    scene = "",
    title = "",
    url = scene.split("@")[0],
    type = scene.split("@")[1] || "news",
  }) {
    const starredInfos = get<StarredInfo[]>(STARRED_INFO_LIST_KEY) ?? [];

    this.state.title = title;
    this.state.type = type as InfoType;
    this.state.url = url;

    if (!url) {
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });
      console.error(`${url}@${type}`);
    }

    this.getInfo();
    this.setData({
      color: getPageColor(),
      theme: info.theme,
      pageTitle: getTitle(type as InfoType),
      title,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${appID}&page=function/info/detail&scene=${url}@${type}`,
      },
      starred: starredInfos.some((item) => item.url === url),
    });
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { type, url, title } = this.state;

    return {
      title,
      path: `/function/info/detail?type=${type}&title=${title}&url=${url}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { type, url, title } = this.state;

    return {
      title,
      query: `type=${type}&title=${title}&url=${url}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { type, url, title } = this.state;

    return {
      title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${type}&title=${title}&url=${url}`,
    };
  },

  async getInfo() {
    const { type, url } = this.state;

    const result = await getInfo(url);

    wx.hideLoading();
    if (result.success) {
      const { title, time, pageView, author, editor, from, content } = result;

      this.setData({
        status: "success",
        title,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "share.title": title,
        time,
        pageView,
        author,
        editor,
        from,
        content,
      });
      this.state.info = {
        title,
        time,
        pageView,
        author,
        editor,
        from,
        content,
        type,
        url,
      };
    } else {
      this.setData({ status: "error" });
    }
  },

  toggleStar() {
    const { starred } = this.data;
    const { info, url } = this.state;

    if (!info) showToast("内容仍在获取", 1500, "error");

    if (starred) {
      const starredInfos = get<StarredInfo[]>(STARRED_INFO_LIST_KEY)!;

      set(
        STARRED_INFO_LIST_KEY,
        starredInfos.filter((item) => item.url !== url),
      );
    } else {
      const starredInfos = get<StarredInfo[]>(STARRED_INFO_LIST_KEY) ?? [];

      set(STARRED_INFO_LIST_KEY, [...starredInfos, info!]);
    }

    showToast(`已${starred ? "取消" : ""}收藏`, 1500, "success");

    this.setData({ starred: !starred });
  },
});

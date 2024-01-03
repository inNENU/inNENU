import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import {
  STARRED_ANNOUNCEMENT_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../config/index.js";
import { getAnnouncement, getOnlineAnnouncement } from "../../service/index.js";
import { getColor, popNotice } from "../../utils/page.js";
import type { StarredAnnouncement } from "../../widgets/info/typings.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const PAGE_ID = "announcement-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "通知详情",
    starred: false,
    status: <"error" | "login" | "success">"success",
  },

  state: {
    url: "",
    title: "",
    info: <StarredAnnouncement | null>null,
  },

  onLoad({ scene = "", title = "", url = scene }) {
    const starredAnnouncements =
      get<StarredAnnouncement[]>(STARRED_ANNOUNCEMENT_LIST_KEY) ?? [];

    this.state.title = title;
    this.state.url = url;

    if (!url) {
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });
      console.error(url);
    }

    this.getInfo();
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      title,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${globalData.appID}&page=function/announcement/detail&scene=${url}`,
      },
      starred: starredAnnouncements.some((item) => item.url === url),
    });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { url, title } = this.state;

    return {
      title,
      path: `/function/announcement/detail?title=${title}&url=${url}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { url, title } = this.state;

    return {
      title,
      query: `title=${title}&url=${url}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { url, title } = this.state;

    return {
      title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `title=${title}&url=${url}`,
    };
  },

  async getInfo() {
    const { url } = this.state;

    const result = await (useOnlineService(PAGE_ID)
      ? getOnlineAnnouncement
      : getAnnouncement)(url);

    wx.hideLoading();
    if (result.success) {
      const { title, time, from, pageView, content } = result;

      this.setData({
        status: "success",
        title,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "share.title": title,
        time,
        from,
        pageView,
        content,
      });
      this.state.info = {
        title,
        time,
        pageView,
        content,
        from,
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
      const starredAcademics = get<StarredAnnouncement[]>(
        STARRED_ANNOUNCEMENT_LIST_KEY,
      )!;

      set(
        STARRED_ANNOUNCEMENT_LIST_KEY,
        starredAcademics.filter((item) => item.url !== url),
      );
    } else {
      const starredAcademics =
        get<StarredAnnouncement[]>(STARRED_ANNOUNCEMENT_LIST_KEY) ?? [];

      set(STARRED_ANNOUNCEMENT_LIST_KEY, [...starredAcademics, info!]);
    }

    showToast(`已${starred ? "取消" : ""}收藏`, 1500, "success");

    this.setData({ starred: !starred });
  },
});

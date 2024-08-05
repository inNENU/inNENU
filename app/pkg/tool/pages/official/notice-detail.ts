import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../../../api/index.js";
import {
  STARRED_ANNOUNCEMENT_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../../../config/index.js";
import { appID, info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type { StarredOfficialNoticeData } from "../../../../widgets/star/typings.js";
import { getOfficialNoticeDetail } from "../../service/index.js";

const PAGE_ID = "official-notice-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "通知详情",
    starred: false,
    status: "success" as "error" | "login" | "success",
  },

  state: {
    url: "",
    title: "",
    info: null as StarredOfficialNoticeData | null,
  },

  onLoad({ scene = "", title = "", url = scene }) {
    const starredAnnouncements =
      get<StarredOfficialNoticeData[]>(STARRED_ANNOUNCEMENT_LIST_KEY) ?? [];

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
      color: getPageColor(),
      theme: info.theme,
      title,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${appID}&page=pkg/tool/pages/official/notice-detail&scene=${url}`,
      },
      starred: starredAnnouncements.some((item) => item.url === url),
    });
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { url, title } = this.state;

    return {
      title,
      path: `/pkg/tool/pages/official/notice-detail?title=${title}&url=${url}`,
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

    const result = await getOfficialNoticeDetail(url);

    wx.hideLoading();
    if (result.success) {
      const { title, time, from, pageView, content } = result.data;

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
      const starredAcademics = get<StarredOfficialNoticeData[]>(
        STARRED_ANNOUNCEMENT_LIST_KEY,
      )!;

      set(
        STARRED_ANNOUNCEMENT_LIST_KEY,
        starredAcademics.filter((item) => item.url !== url),
      );
    } else {
      const starredAcademics =
        get<StarredOfficialNoticeData[]>(STARRED_ANNOUNCEMENT_LIST_KEY) ?? [];

      set(STARRED_ANNOUNCEMENT_LIST_KEY, [...starredAcademics, info!]);
    }

    showToast(`已${starred ? "取消" : ""}收藏`, 1500, "success");

    this.setData({ starred: !starred });
  },
});

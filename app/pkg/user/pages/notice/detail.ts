import { $Page, get, set, showModal, showToast } from "@mptool/all";

import {
  STARRED_NOTICE_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../../../config/index.js";
import type { NoticeType } from "../../../../service/index.js";
import { appId, info, user } from "../../../../state/index.js";
import type { StarredNoticeData } from "../../../../typings/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import { getNoticeDetail } from "../../service/index.js";

const PAGE_ID = "notice-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "通知详情",
    starred: false,
    status: "success" as "error" | "login" | "success",
  },

  state: {
    id: "",
    url: "",
    title: "",
    type: "notice" as NoticeType,
    notice: null as StarredNoticeData | null,
  },

  onLoad({ scene = "", title = "", id, url = scene, type = "notice" }) {
    const starredNotices =
      get<StarredNoticeData[]>(STARRED_NOTICE_LIST_KEY) ?? [];

    this.state.type = type as NoticeType;

    if (url) {
      this.state.url = url;

      this.getNotice();
    } else if (id) {
      this.state.id = id;

      this.getNotice();
    } else
      showModal("无法获取", "请提供公告信息", () => {
        this.$back();
      });

    this.setData({
      color: getPageColor(),
      theme: info.theme,
      pageTitle: `${type === "news" ? "新闻" : "通知"}详情`,
      title,
      share: {
        title,
        shareable: true,
        qrcode: url
          ? `${service}mp/qrcode?appId=${appId}&page=pkg/user/pages/notice/detail&scene=${url}`
          : null,
      },
      starred: starredNotices.some(
        (item) => item.url === url || item.id === id,
      ),
    });
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { type, url, title } = this.state;

    return {
      title,
      path: `/pkg/user/pages/notice/detail?type=${type}&url=${url}&title=${title}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { type, url, title } = this.state;

    return {
      title,
      query: `type=${type}&url=${url}&title=${title}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { type, url, title } = this.state;

    return {
      title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${type}&url=${url}&title=${title}`,
    };
  },

  async getNotice() {
    const { id, url, type } = this.state;

    if (!user.account) {
      this.setData({ status: "login" });

      return;
    }

    wx.showLoading({ title: "获取中" });

    const result = await getNoticeDetail({ noticeID: id, noticeUrl: url });

    wx.hideLoading();

    if (!result.success) {
      this.setData({ status: "error", errMsg: result.msg });

      return;
    }

    const { title, time, pageView, from, content } = result.data;

    this.setData({
      status: "success",
      title,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "share.title": title,
      time,
      pageView,
      from,
      content,
    });
    this.state.notice = {
      title,
      time,
      pageView,
      from,
      content,
      id,
      url,
      type,
    };
  },

  toggleStar() {
    const { starred } = this.data;
    const { notice, id, url } = this.state;

    if (!notice) showToast("通知未获取完成", 1500, "error");

    if (starred) {
      const starredNotices = get<StarredNoticeData[]>(STARRED_NOTICE_LIST_KEY)!;

      set(
        STARRED_NOTICE_LIST_KEY,
        starredNotices.filter((item) => item.url === url || item.id === id),
      );
    } else {
      const starredNotices =
        get<StarredNoticeData[]>(STARRED_NOTICE_LIST_KEY) ?? [];

      set(STARRED_NOTICE_LIST_KEY, [...starredNotices, notice]);
    }

    showToast(`已${starred ? "取消" : ""}收藏`, 1500, "success");

    this.setData({ starred: !starred });
  },
});

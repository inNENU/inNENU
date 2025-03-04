import { $Page, get, set, showModal, showToast } from "@mptool/all";

import {
  STARRED_NOTICE_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../../../config/index.js";
import type { NoticeType } from "../../../../service/index.js";
import { appID, info, user } from "../../../../state/index.js";
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
    title: "",
    type: "notice" as NoticeType,
    notice: null as StarredNoticeData | null,
  },

  onLoad({ scene = "", title = "", id = scene, type = "notice" }) {
    const starredNotices =
      get<StarredNoticeData[]>(STARRED_NOTICE_LIST_KEY) ?? [];

    this.state.type = type as NoticeType;
    this.state.id = id;

    if (id) this.getNotice();
    else
      showModal("无法获取", "请提供公告 ID", () => {
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
        qrcode: `${service}mp/qrcode?appID=${appID}&page=pkg/user/pages/notice/detail&scene=${id}`,
      },
      starred: starredNotices.some((item) => item.id === id),
    });
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { type, id, title } = this.state;

    return {
      title,
      path: `/pkg/user/pages/notice/detail?type=${type}&id=${id}&title=${title}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { type, id, title } = this.state;

    return {
      title,
      query: `type=${type}&id=${id}&title=${title}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { type, id, title } = this.state;

    return {
      title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `type=${type}&id=${id}&title=${title}`,
    };
  },

  async getNotice() {
    const { id, type } = this.state;

    if (!user.account) {
      this.setData({ status: "login" });

      return;
    }

    wx.showLoading({ title: "获取中" });

    const result = await getNoticeDetail(id);

    wx.hideLoading();

    if (!result.success) {
      this.setData({ status: "error", errMsg: result.msg });

      return;
    }

    const { title, time, pageView, author, from, content } = result.data;

    this.setData({
      status: "success",
      title,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "share.title": title,
      time,
      pageView,
      author,
      from,
      content,
    });
    this.state.notice = {
      title,
      time,
      pageView,
      author,
      from,
      content,
      id,
      type,
    };
  },

  toggleStar() {
    const { starred } = this.data;
    const { notice, id } = this.state;

    if (!notice) showToast("通知未获取完成", 1500, "error");

    if (starred) {
      const starredNotices = get<StarredNoticeData[]>(STARRED_NOTICE_LIST_KEY)!;

      set(
        STARRED_NOTICE_LIST_KEY,
        starredNotices.filter((item) => item.id !== id),
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

import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import {
  STARRED_NOTICE_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../config/index.js";
import type { NoticeType } from "../../service/index.js";
import { getNotice, getOnlineNotice } from "../../service/index.js";
import { ensureActionLogin } from "../../service/index.js";
import { getColor, popNotice } from "../../utils/page.js";
import type { StarredNotice } from "../../widgets/star/typings.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const PAGE_ID = "notice-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "通知详情",
    starred: false,
    status: <"error" | "login" | "success">"success",
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
    id: "",
    title: "",
    type: <NoticeType>"notice",
    notice: <StarredNotice | null>null,
  },

  onLoad({ scene = "", title = "", id = scene, type = "notice" }) {
    const starredNotices = get<StarredNotice[]>(STARRED_NOTICE_LIST_KEY) ?? [];

    this.state.type = <NoticeType>type;
    this.state.id = id;

    if (id) this.getNotice();
    else
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });

    this.setData({
      color: getColor(),
      theme: globalData.theme,
      pageTitle: `${type === "news" ? "新闻" : "通知"}详情`,
      title,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${globalData.appID}&page=function/notice/detail&scene=${id}`,
      },
      starred: starredNotices.some((item) => item.id === id),
    });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { type, id, title } = this.state;

    return {
      title,
      path: `/function/notice/detail?type=${type}&id=${id}&title=${title}`,
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

    if (globalData.account) {
      wx.showLoading({ title: "获取中" });

      const err = await ensureActionLogin(
        globalData.account,
        this.state.loginMethod,
      );

      if (err) {
        wx.hideLoading();
        showToast(err.msg);
        this.state.loginMethod = "login";

        return this.setData({ status: "error" });
      }

      const result = await (useOnlineService(PAGE_ID)
        ? getOnlineNotice
        : getNotice)({
        noticeID: id,
      });

      wx.hideLoading();

      if (result.success) {
        const { title, time, pageView, author, from, content } = result;

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
        this.state.loginMethod = "check";
      } else {
        this.setData({ status: "error" });
        this.state.loginMethod = "login";
      }
    } else {
      this.setData({ status: "login" });
    }
  },

  toggleStar() {
    const { starred } = this.data;
    const { notice, id } = this.state;

    if (!notice) showToast("通知未获取完成", 1500, "error");

    if (starred) {
      const starredNotices = get<StarredNotice[]>(STARRED_NOTICE_LIST_KEY)!;

      set(
        STARRED_NOTICE_LIST_KEY,
        starredNotices.filter((item) => item.id !== id),
      );
    } else {
      const starredNotices =
        get<StarredNotice[]>(STARRED_NOTICE_LIST_KEY) ?? [];

      set(STARRED_NOTICE_LIST_KEY, [...starredNotices, notice]);
    }

    showToast(`已${starred ? "取消" : ""}收藏`, 1500, "success");

    this.setData({ starred: !starred });
  },
});

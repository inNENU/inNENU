import { $Page } from "@mptool/enhance";

import { getNotice } from "./api.js";
import { getActionCookie } from "../../api/action.js";
import { showModal } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { getColor } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "notice-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "通知详情",

    status: <"error" | "login" | "success">"success",
  },

  state: {
    id: "",
    title: "",
  },

  onLoad({ id = "", title = "", type = "notice" }) {
    this.state.title = title;
    this.state.id = id;
    if (id) this.getNotice(id);
    else
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });

    this.setData({
      color: getColor(),
      theme: globalData.theme,
      pageTitle: `${type === "news" ? "新闻" : "通知"}详情`,
    });
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { id, title } = this.state;

    return {
      title,
      path: `/function/notice/detail?id=${id}&title=${title}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { id, title } = this.state;

    return {
      title,
      query: `id=${id}&title=${title}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { id, title } = this.state;

    return {
      title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `id=${id}&title=${title}`,
    };
  },

  getNotice(id: string) {
    if (globalData.account) {
      wx.showLoading({ title: "获取中" });
      getActionCookie(globalData.account).then((res) => {
        if (res.success)
          getNotice({ cookies: res.cookies, noticeID: id }).then((res) => {
            wx.hideLoading();
            if (res.success) {
              const { title, time, pageView, author, from, content } = res;

              this.setData({
                status: "success",
                title,
                time,
                pageView,
                author,
                from,
                content,
              });
            } else this.setData({ status: "error" });
          });
        else {
          wx.hideLoading();
          this.setData({ status: "error" });
        }
      });
    } else this.setData({ status: "login" });
  },
});

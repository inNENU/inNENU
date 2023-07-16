import { $Page } from "@mptool/all";

import { getNotice, getOnlineNotice } from "./notice-detail.js";
import { ensureActionLogin } from "../../api/login/action.js";
import { showModal, showToast } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { getColor, popNotice } from "../../utils/page.js";

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
    type: "",
  },

  onLoad({ id = "", title = "", type = "notice" }) {
    this.state.title = title;
    this.state.type = type;
    this.state.id = id;

    if (id) this.getNotice(this.$state.firstOpen);
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

  getNotice(check: boolean) {
    if (globalData.account) {
      wx.showLoading({ title: "获取中" });
      ensureActionLogin(globalData.account, check).then((err) => {
        if (err) {
          wx.hideLoading();
          showToast(err.msg);
          this.setData({ status: "error" });
        } else
          (globalData.service[PAGE_ID] === "online"
            ? getOnlineNotice
            : getNotice)({ noticeID: this.state.id }).then((res) => {
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
      });
    } else this.setData({ status: "login" });
  },
});

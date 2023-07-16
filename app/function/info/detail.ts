import { $Page } from "@mptool/all";

import { getInfo, getOnlineInfo } from "./info.js";
import { type MainInfoType } from "./typings.js";
import { showModal } from "../../api/index.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const type2Title = {
  news: "学校新闻",
  notice: "学校通知",
  academic: "学术会议",
};

const PAGE_ID = "info-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "通知详情",

    status: <"error" | "login" | "success">"success",
  },

  state: {
    url: "",
    title: "",
    type: "",
  },

  onLoad({ title = "", type = "notice", url = "" }) {
    if (!url)
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });

    this.state.title = title;
    this.state.type = type;
    this.state.url = url;

    this.getInfo();
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      pageTitle: type2Title[<MainInfoType>type],
    });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { type, url, title } = this.state;

    return {
      title,
      path: `/function/notice/detail?type=${type}&title=${title}&url=${url}`,
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

  getInfo() {
    (globalData.service[PAGE_ID] === "online" ? getOnlineInfo : getInfo)(
      this.state.url,
    ).then((res) => {
      wx.hideLoading();
      if (res.success) {
        const { title, time, pageView, author, editor, from, content } = res;

        this.setData({
          status: "success",
          title,
          time,
          pageView,
          author,
          editor,
          from,
          content,
        });
      } else this.setData({ status: "error" });
    });
  },
});

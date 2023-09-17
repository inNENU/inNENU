import { $Page, get, set } from "@mptool/all";

import { getInfo, getOnlineInfo } from "./info.js";
import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import {
  STARRED_INFO_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../config/index.js";
import { getColor, popNotice } from "../../utils/page.js";
import type { InfoType, StarredInfo } from "../../widgets/info/info.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const type2Title = {
  news: "学校新闻",
  notice: "学校通知",
  academic: "学术会议",
};

const PAGE_ID = "info-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "通知详情",
    starred: false,
    status: <"error" | "login" | "success">"success",
  },

  state: {
    url: "",
    title: "",
    type: <InfoType>"notice",
    info: <StarredInfo | null>null,
  },

  onLoad({ title = "", type = "notice", url = "" }) {
    const starredInfos = get<StarredInfo[]>(STARRED_INFO_LIST_KEY) ?? [];

    this.state.title = title;
    this.state.type = <InfoType>type;
    this.state.url = url;

    if (!url)
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });

    this.getInfo();
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      pageTitle: type2Title[<InfoType>type],
      title,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${globalData.appID}&page=function/notice/detail&scene=${url}|${type}`,
      },
      starred: starredInfos.some((item) => item.url === url),
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

  async getInfo() {
    const { type, url } = this.state;

    const result = await (useOnlineService(PAGE_ID) ? getOnlineInfo : getInfo)(
      url,
    );

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

    if (!info) showToast("通知未获取完成", 1500, "error");

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

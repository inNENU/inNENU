import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import {
  STARRED_INFO_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../config/index.js";
import type { InfoType } from "../../service/index.js";
import { getInfo, getOnlineInfo } from "../../service/index.js";
import { info } from "../../utils/info.js";
import { getColor, popNotice } from "../../utils/page.js";
import { getTitle } from "../../widgets/recent/utils.js";
import type { StarredInfo } from "../../widgets/star/typings.js";

const { useOnlineService } = getApp<AppOption>();

const PAGE_ID = "info-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "详情",
    starred: false,
    status: <"error" | "login" | "success">"success",
  },

  state: {
    url: "",
    title: "",
    type: <InfoType>"news",
    info: <StarredInfo | null>null,
  },

  onLoad({
    scene = "",
    title = "",
    url = scene.split("@")[0],
    type = scene.split("@")[1] || "news",
  }) {
    const starredInfos = get<StarredInfo[]>(STARRED_INFO_LIST_KEY) ?? [];

    this.state.title = title;
    this.state.type = <InfoType>type;
    this.state.url = url;

    if (!url) {
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });
      console.error(`${url}@${type}`);
    }

    this.getInfo();
    this.setData({
      color: getColor(),
      theme: info.theme,
      pageTitle: getTitle(<InfoType>type),
      title,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${info.appID}&page=function/info/detail&scene=${url}@${type}`,
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

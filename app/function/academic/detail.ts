import { $Page, get, set } from "@mptool/all";

import { showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import {
  STARRED_ACADEMIC_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../config/index.js";
import { getAcademic, getOnlineAcademic } from "../../service/index.js";
import { info } from "../../utils/info.js";
import { getColor, popNotice } from "../../utils/page.js";
import type { StarredAcademic } from "../../widgets/star/typings.js";

const { useOnlineService } = getApp<AppOption>();

const PAGE_ID = "academic-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "学术报告详情",
    starred: false,
    status: <"error" | "login" | "success">"success",
  },

  state: {
    title: "",
    person: "",
    url: "",
    info: <StarredAcademic | null>null,
  },

  onLoad({ scene = "", title = "", person = "", url = scene }) {
    const starredInfos =
      get<StarredAcademic[]>(STARRED_ACADEMIC_LIST_KEY) ?? [];

    this.state = {
      ...this.state,
      title,
      url,
      person,
    };

    if (!url) {
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });
      console.error(url);
    }

    this.getInfo();
    this.setData({
      color: getColor(),
      theme: info.theme,
      title,
      person,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${info.appID}&page=function/academic/detail&scene=${url}`,
      },
      starred: starredInfos.some((item) => item.url === url),
    });
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { title, person, url } = this.state;

    return {
      title,
      path: `/function/academic/detail?title=${title}&person=${person}&url=${url}`,
    };
  },

  onShareTimeline(): WechatMiniprogram.Page.ICustomTimelineContent {
    const { title, person, url } = this.state;

    return {
      title,
      query: `title=${title}&person=${person}&url=${url}`,
    };
  },

  onAddToFavorites(): WechatMiniprogram.Page.IAddToFavoritesContent {
    const { title, person, url } = this.state;

    return {
      title,
      imageUrl: `${appCoverPrefix}.jpg`,
      query: `title=${title}&person=${person}&url=${url}`,
    };
  },

  async getInfo() {
    const { person, url } = this.state;

    const result = await (
      useOnlineService(PAGE_ID) ? getOnlineAcademic : getAcademic
    )(url);

    wx.hideLoading();
    if (result.success) {
      const { title, time, pageView, content } = result;

      this.setData({
        status: "success",
        title,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "share.title": title,
        time,
        pageView,
        content,
      });
      this.state.info = {
        title,
        time,
        person,
        pageView,
        content,
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
      const starredAcademics = get<StarredAcademic[]>(
        STARRED_ACADEMIC_LIST_KEY,
      )!;

      set(
        STARRED_ACADEMIC_LIST_KEY,
        starredAcademics.filter((item) => item.url !== url),
      );
    } else {
      const starredAcademics =
        get<StarredAcademic[]>(STARRED_ACADEMIC_LIST_KEY) ?? [];

      set(STARRED_ACADEMIC_LIST_KEY, [...starredAcademics, info!]);
    }

    showToast(`已${starred ? "取消" : ""}收藏`, 1500, "success");

    this.setData({ starred: !starred });
  },
});

import { $Page, get, logger, set } from "@mptool/all";

import { showModal, showToast } from "../../../../api/index.js";
import {
  STARRED_ACADEMIC_LIST_KEY,
  appCoverPrefix,
  service,
} from "../../../../config/index.js";
import { appID, info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type { StarredOfficialAcademicData } from "../../../../widgets/star/typings.js";
import { getOfficialAcademicDetail } from "../../service/index.js";

const PAGE_ID = "official-academic-detail";

$Page(PAGE_ID, {
  data: {
    pageTitle: "学术报告详情",
    starred: false,
    status: "success" as "error" | "login" | "success",
  },

  state: {
    title: "",
    person: "",
    url: "",
    info: null as StarredOfficialAcademicData | null,
  },

  onLoad({ scene = "", title = "", person = "", url = scene }) {
    const starredInfos =
      get<StarredOfficialAcademicData[]>(STARRED_ACADEMIC_LIST_KEY) ?? [];

    this.state = {
      ...this.state,
      title,
      url,
      person,
    };

    if (!url)
      showModal("无法获取", "请提供 ID", () => {
        this.$back();
      });

    this.getInfo();
    this.setData({
      color: getPageColor(),
      theme: info.theme,
      title,
      person,
      share: {
        title,
        shareable: true,
        qrcode: `${service}mp/qrcode?appID=${appID}&page=pkg/tool/pages/official/academic-detail&scene=${url}`,
      },
      starred: starredInfos.some((item) => item.url === url),
    });
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  onShareAppMessage(): WechatMiniprogram.Page.ICustomShareContent {
    const { title, person, url } = this.state;

    return {
      title,
      path: `/pkg/tool/pages/official/academic-detail?title=${title}&person=${person}&url=${url}`,
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

    wx.showLoading({ title: "获取中" });

    const result = await getOfficialAcademicDetail(url);

    wx.hideLoading();

    if (result.success) {
      const { title, time, pageView, content } = result.data;

      this.setData({
        status: "success",
        title,
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "share.title": title,
        time,
        pageView,
        content,
      });

      // store info in page state
      this.state.info = {
        title,
        time,
        person,
        pageView,
        content,
        url,
      };
    } else {
      logger.error(result.msg);
      this.setData({ status: "error" });
    }
  },

  toggleStar() {
    const { starred } = this.data;
    const { info, url } = this.state;

    if (!info) showToast("内容仍在获取", 1500, "error");

    if (starred) {
      const starredAcademics = get<StarredOfficialAcademicData[]>(
        STARRED_ACADEMIC_LIST_KEY,
      )!;

      set(
        STARRED_ACADEMIC_LIST_KEY,
        starredAcademics.filter((item) => item.url !== url),
      );
    } else {
      const starredAcademics =
        get<StarredOfficialAcademicData[]>(STARRED_ACADEMIC_LIST_KEY) ?? [];

      set(STARRED_ACADEMIC_LIST_KEY, [...starredAcademics, info!]);
    }

    showToast(`已${starred ? "取消" : ""}收藏`, 1500, "success");

    this.setData({ starred: !starred });
  },
});

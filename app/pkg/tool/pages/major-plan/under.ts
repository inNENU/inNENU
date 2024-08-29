import { $Page, showModal } from "@mptool/all";

import { appCoverPrefix } from "../../../../config/index.js";
import { showNotice } from "../../../../utils/index.js";
import { getUnderMajorPlan } from "../../service/index.js";

const PAGE_ID = "under-major-plan";
const PAGE_TITLE = "本科人才培养方案";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,
    plans: [] as unknown[],
  },

  onLoad() {
    this.loadPlan();
    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async loadPlan() {
    wx.showLoading({ title: "加载中" });

    const result = await getUnderMajorPlan();

    wx.hideLoading();

    if (result.success) {
      this.setData({
        // TODO: Remove this once document support icon infer
        plans: result.data.map((item) => ({ ...item, icon: "pdf" })),
      });
    } else {
      showModal("获取失败", result.msg);
    }
  },
});

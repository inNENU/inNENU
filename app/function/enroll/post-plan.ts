import { $Page } from "@mptool/all";

import type { PostEnrollSchoolPlan } from "./getPostPlan.js";
import { getPostPlan } from "./getPostPlan.js";
import { showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "post-enroll-plan";
const PAGE_TITLE = "研究生招生计划";

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,
  },

  state: { plans: <PostEnrollSchoolPlan[]>[] },

  onLoad({ recommend }) {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      title: recommend ? "研究生推免计划" : "研究生招生计划",
    });
    this.getPlan(Boolean(recommend));
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/enroll/plan",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  getPlan(isRecommend: boolean) {
    wx.showLoading({ title: "获取中" });

    return getPostPlan(isRecommend).then((res) => {
      wx.hideLoading();

      if (res.success) {
        this.state.plans = res.data;

        this.setData({
          schools: ["全部", ...res.data.map(({ name }) => name)],
          schoolIndex: 0,
          plans: res.data,
        });
      } else {
        showModal("获取失败", res.msg, () => {
          void this.$back();
        });
      }
    });
  },

  onSchoolChange({ detail }: WechatMiniprogram.PickerChange) {
    const index = Number(detail.value);

    this.setData({
      schoolIndex: index,
      plans:
        index === 0
          ? this.state.plans
          : [this.state.plans[Number(detail.value) - 1]],
    });
  },
});

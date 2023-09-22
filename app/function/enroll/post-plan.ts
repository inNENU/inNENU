import { $Page } from "@mptool/all";

import type { PostEnrollSchoolPlan } from "./getPostPlan.js";
import { getPostPlan } from "./getPostPlan.js";
import { setClipboard, showModal, showToast } from "../../api/index.js";
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

  onLoad({ recommend, school = "全部" }) {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      title: recommend ? "研究生推免计划" : "研究生招生计划",
    });
    this.getPlan(Boolean(recommend), school);
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/enroll/post-plan",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  getPlan(isRecommend: boolean, school: string) {
    wx.showLoading({ title: "获取中" });

    return getPostPlan(isRecommend).then((res) => {
      wx.hideLoading();

      if (res.success) {
        const schools = ["全部", ...res.data.map(({ name }) => name)];

        this.setData({
          schools,
          schoolIndex: Math.max(schools.indexOf(school), 0),
          plans: res.data,
        });
        this.state.plans = res.data;
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

  openSite({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { site: string }
  >) {
    const { site } = currentTarget.dataset;

    if (globalData.env === "app") wx.miniapp.openUrl({ url: site });
    else setClipboard(site).then(() => showToast("网址已复制"));
  },
});

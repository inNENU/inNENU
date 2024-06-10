import { $Page } from "@mptool/all";

import { setClipboard, showModal, showToast } from "../../api/index.js";
import { appCoverPrefix } from "../../config/index.js";
import type {
  PostEnrollSchoolPlan,
  PostRecommendSchoolPlan,
} from "../../service/index.js";
import { getPostPlan, getPostRecommendPlan } from "../../service/index.js";
import { info } from "../../state/index.js";
import { getColor, showNotice } from "../../utils/index.js";

const PAGE_ID = "post-enroll-plan";
const PAGE_TITLE = "研究生招生计划";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
  },

  state: { plans: [] as PostEnrollSchoolPlan[] | PostRecommendSchoolPlan[] },

  onLoad({ recommend, school = "全部" }) {
    this.setData({
      color: getColor(),
      theme: info.theme,
      title: recommend ? "研究生推免计划" : "研究生招生计划",
    });
    this.getPlan(Boolean(recommend), school);
  },

  onShow() {
    showNotice(PAGE_ID);
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

    if (isRecommend)
      return getPostRecommendPlan().then((res) => {
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
            this.$back();
          });
        }
      });

    return getPostPlan().then((res) => {
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
          this.$back();
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

    if (info.env === "app") wx.miniapp.openUrl({ url: site });
    else setClipboard(site).then(() => showToast("网址已复制"));
  },
});

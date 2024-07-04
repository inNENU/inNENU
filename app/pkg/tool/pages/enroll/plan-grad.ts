import { $Page } from "@mptool/all";

import { copyContent, showModal, showToast } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { env, info } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type {
  GradEnrollSchoolPlan,
  GradRecommendSchoolPlan,
} from "../../service/index.js";
import { getGradPlan, getGradRecommendPlan } from "../../service/index.js";

const PAGE_ID = "grad-enroll-plan";
const PAGE_TITLE = "研究生招生计划";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
  },

  state: { plans: [] as GradEnrollSchoolPlan[] | GradRecommendSchoolPlan[] },

  onLoad({ recommend, school = "全部" }) {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
      title: `研究生${recommend ? "推免" : "招生"}计划`,
    });
    this.getPlan(Boolean(recommend), school);
  },

  onShow() {
    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  getPlan(isRecommend: boolean, school: string) {
    wx.showLoading({ title: "获取中" });

    if (isRecommend)
      return getGradRecommendPlan().then((res) => {
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

    return getGradPlan().then((res) => {
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

    if (env === "app") wx.miniapp.openUrl({ url: site });
    else copyContent(site).then(() => showToast("网址已复制"));
  },
});

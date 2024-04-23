import { $Page, get, set } from "@mptool/all";

import { retryAction, showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { HOUR } from "../../config/index.js";
import { appCoverPrefix } from "../../config/info.js";
import { CHANGE_MAJOR_DATA_KEY } from "../../config/keys.js";
import type { ChangeMajorPlan } from "../../service/index.js";
import {
  LoginFailType,
  ensureOnlineUnderSystemLogin,
  ensureUnderSystemLogin,
  getOnlineUnderChangeMajorPlan,
  getUnderChangeMajorPlans,
} from "../../service/index.js";
import { info } from "../../state/info.js";
import { user } from "../../state/user.js";
import { getColor, popNotice } from "../../utils/page.js";

const { useOnlineService } = getApp<AppOption>();
const { envName } = info;
const PAGE_ID = "change-major-plan";
const PAGE_TITLE = "转专业计划";

interface PlanData {
  header: string;
  plans: ChangeMajorPlan[];
}

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    header: "",
    plans: [] as ChangeMajorPlan[],

    subjects: ["全部科类"] as string[],
    subjectIndex: 0,
    schools: ["全部学院"] as string[],
    schoolIndex: 0,
    notFull: false,

    desc: "数据来自教务处教学服务系统",

    needLogin: false,
  },

  state: {
    loginMethod: "validate" as "check" | "login" | "validate",
    plans: [] as ChangeMajorPlan[],
    inited: false,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: info.theme,
    });
  },

  onShow() {
    const { account, info } = user;

    if (account) {
      if (!info) {
        return showModal(
          "个人信息缺失",
          `${envName}本地暂无个人信息，请重新登录`,
          () => {
            this.$go("account?update=true");
          },
        );
      }

      if (!this.state.inited || this.data.needLogin) {
        if (info.typeId !== "bks")
          return showModal("暂不支持", "转专业计划查询仅支持本科生", () => {
            this.$back();
          });

        const plans = get<PlanData>(CHANGE_MAJOR_DATA_KEY);

        if (plans) this.setPlans(plans);
        else this.getPlans();
      }
    }

    this.setData({ needLogin: !user.account });

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/course/change-major",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getPlans() {
    wx.showLoading({ title: "获取中" });

    try {
      const err = await (
        useOnlineService("under-login")
          ? ensureOnlineUnderSystemLogin
          : ensureUnderSystemLogin
      )(user.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const result = await (
        useOnlineService(PAGE_ID)
          ? getOnlineUnderChangeMajorPlan
          : getUnderChangeMajorPlans
      )();

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        set(CHANGE_MAJOR_DATA_KEY, result, 3 * HOUR);

        this.setPlans(result);
        this.state.loginMethod = "check";
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        retryAction("登录过期", result.msg, () => this.getPlans());
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", msg as string);
    }
  },

  setPlans(data: PlanData) {
    const schools = Array.from(new Set(data.plans.map((plan) => plan.school)));
    const subjects = Array.from(
      new Set(data.plans.map((plan) => plan.subject)),
    );

    this.state.plans = data.plans;
    this.setData({
      header: data.header,
      plans: data.plans,
      schools: ["全部学院", ...schools],
      schoolIndex: 0,
      subjects: ["全部科类", ...subjects],
      subjectIndex: 0,
    });
  },

  changeSubject({ detail }: WechatMiniprogram.PickerChange) {
    const subjectIndex = Number(detail.value);

    this.setData({ subjectIndex }, () => {
      this.updatePlans();
    });
  },

  changeSchool({ detail }: WechatMiniprogram.PickerChange) {
    const schoolIndex = Number(detail.value);

    this.setData({ schoolIndex }, () => {
      this.updatePlans();
    });
  },

  toggleFull() {
    const notFull = !this.data.notFull;

    this.setData({ notFull }, () => {
      this.updatePlans();
    });
  },

  updatePlans() {
    const { notFull, subjects, subjectIndex, schools, schoolIndex } = this.data;
    const { plans } = this.state;

    this.setData({
      plans: plans
        .filter(
          ({ subject }) =>
            subjectIndex === 0 || subject === subjects[subjectIndex],
        )
        .filter(
          ({ school }) => schoolIndex === 0 || school === schools[schoolIndex],
        )
        .filter(({ current, plan }) => !notFull || current < plan),
    });
  },
});

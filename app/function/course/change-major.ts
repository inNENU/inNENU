import { $Page, get, set } from "@mptool/all";

import {
  getOnlineUnderChangeMajorPlan,
  getUnderChangeMajorPlans,
} from "./change-major-plan.js";
import type { ChangeMajorPlan } from "./typings.js";
import { showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { CHANGE_MAJOR_DATA_KEY } from "../../config/keys.js";
import { LoginFailType, ensureUnderSystemLogin } from "../../login/index.js";
import { HOUR } from "../../utils/constant.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

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
    plans: <ChangeMajorPlan[]>[],

    subjects: <string[]>[],
    subjectIndex: 0,
    schools: <string[]>[],
    schoolIndex: 0,
    notFull: false,

    desc: "数据来自教务处教学服务系统",

    needLogin: false,
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
    plans: <ChangeMajorPlan[]>[],
    inited: false,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
    });
  },

  onShow() {
    const { account, userInfo } = globalData;

    if (account) {
      if (!userInfo) {
        return showModal(
          "个人信息缺失",
          "小程序本地暂无个人信息，请重新登录",
          () => {
            this.$go("account?update=true");
          },
        );
      }

      if (!this.state.inited || this.data.needLogin) {
        if (userInfo.typeId !== "bks")
          return showModal("暂不支持", "转专业计划查询仅支持本科生", () => {
            this.$back();
          });

        const info = get<PlanData>(CHANGE_MAJOR_DATA_KEY);

        if (info) this.setPlans(info);
        else this.getPlans();
      }
    }

    this.setData({ needLogin: !globalData.account });

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
      const err = await ensureUnderSystemLogin(
        globalData.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await (useOnlineService(PAGE_ID)
        ? getOnlineUnderChangeMajorPlan
        : getUnderChangeMajorPlans)();

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        set(CHANGE_MAJOR_DATA_KEY, result, 3 * HOUR);

        this.setPlans(result);
        this.state.loginMethod = "check";
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        wx.showModal({
          title: "登录过期",
          content: result.msg,
          confirmText: "重试",
          success: () => {
            this.getPlans();
          },
        });
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", <string>msg);
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

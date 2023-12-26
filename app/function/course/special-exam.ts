import { $Page, get, set } from "@mptool/all";

import type { UnderSpecialExamItem } from "./under-special-exam.js";
import {
  getOnlineUnderSpecialExamScore,
  getUnderSpecialExamScore,
} from "./under-special-exam.js";
import { retryAction, showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { SPECIAL_EXAM_DATA_KEY } from "../../config/keys.js";
import { LoginFailType, ensureUnderSystemLogin } from "../../login/index.js";
import { HOUR } from "../../utils/constant.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();
const { envName } = globalData;

const PAGE_ID = "special-exam";
const PAGE_TITLE = "专项考试成绩";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    data: <UnderSpecialExamItem[]>[],

    desc: "数据来自教务处教学服务系统",

    needLogin: false,
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
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
          `${envName}本地暂无个人信息，请重新登录`,
          () => {
            this.$go("account?update=true");
          },
        );
      }

      if (!this.state.inited || this.data.needLogin) {
        if (userInfo.typeId !== "bks")
          return showModal("暂不支持", "专项考试查询仅支持本科生", () => {
            this.$back();
          });

        const data = get<UnderSpecialExamItem[]>(SPECIAL_EXAM_DATA_KEY);

        if (data) this.setData({ data });
        else this.getSpecialExamScore();
      }
    }

    this.setData({ needLogin: !globalData.account });

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/course/special-exam",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getSpecialExamScore() {
    wx.showLoading({ title: "获取中" });

    try {
      const err = await ensureUnderSystemLogin(
        globalData.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await (useOnlineService(PAGE_ID)
        ? getOnlineUnderSpecialExamScore
        : getUnderSpecialExamScore)();

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        set(SPECIAL_EXAM_DATA_KEY, result.data, 3 * HOUR);

        this.setData({ data: result.data });
        this.state.loginMethod = "check";
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        retryAction("登录过期", result.msg, () => this.getSpecialExamScore());
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
  },
});

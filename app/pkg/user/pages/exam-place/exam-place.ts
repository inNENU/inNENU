import { $Page, get, retry, set, showModal } from "@mptool/all";

import type { ExamPlace } from "../..//service/index.js";
import {
  EXAM_PLACE_DATA_KEY,
  HOUR,
  appCoverPrefix,
} from "../../../../config/index.js";
import type { LoginMethod } from "../../../../service/index.js";
import { ActionFailType } from "../../../../service/index.js";
import { envName, info, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import {
  ensureUnderSystemLogin,
  getUnderExamPlace,
} from "../../service/index.js";

const PAGE_ID = "exam-place";
const PAGE_TITLE = "考场查询";

interface ExamPlaceData {
  name: string;
  exams: ExamPlace[];
}

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    data: [] as ExamPlaceData[],

    desc: "数据来自教务处教学服务系统",

    needLogin: false,
  },

  state: {
    loginMethod: "validate" as LoginMethod,
    inited: false,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });
  },

  onShow() {
    const { account, info } = user;

    if (account) {
      if (!info) {
        showModal(
          "个人信息缺失",
          `${envName}本地暂无个人信息，请重新登录`,
          () => {
            this.$go("account-login?update=true");
          },
        );

        return;
      }

      if (!this.state.inited || this.data.needLogin) {
        if (info.typeId !== "bks") {
          showModal("暂不支持", "考场查询仅支持本科生", () => {
            this.$back();
          });

          return;
        }

        const data = get<ExamPlaceData[]>(EXAM_PLACE_DATA_KEY);

        if (data) this.setData({ data });
        else this.getExamPlace();
      }
    }

    this.setData({ needLogin: !user.account });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getExamPlace() {
    wx.showLoading({ title: "获取中" });

    const err = await ensureUnderSystemLogin(
      user.account!,
      this.state.loginMethod,
    );

    if (err) {
      wx.hideLoading();
      showModal("获取失败", err.msg);

      return;
    }

    const result = await getUnderExamPlace();

    wx.hideLoading();
    this.state.inited = true;

    if (result.success) {
      set(EXAM_PLACE_DATA_KEY, result.data, 3 * HOUR);

      this.setData({ data: result.data });
      this.state.loginMethod = "check";
    } else if (result.type === ActionFailType.Expired) {
      this.state.loginMethod = "force";
      retry("登录过期", result.msg, () => this.getExamPlace());
    } else {
      showModal("获取失败", result.msg);
    }
  },
});

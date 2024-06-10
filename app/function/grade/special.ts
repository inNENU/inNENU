import { $Page, get, set } from "@mptool/all";

import { showModal } from "../../api/index.js";
import {
  HOUR,
  SPECIAL_EXAM_DATA_KEY,
  appCoverPrefix,
} from "../../config/index.js";
import type { UnderSpecialExamResult } from "../../service/index.js";
import {
  ensureUnderStudyLogin,
  getUnderSpecialExam,
} from "../../service/index.js";
import { info, user } from "../../state/index.js";
import { getColor, popNotice } from "../../utils/index.js";

const { envName } = info;

const PAGE_ID = "special-exam";
const PAGE_TITLE = "专项考试成绩";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    data: [] as UnderSpecialExamResult[],

    desc: "数据来自本科教学服务系统",

    needLogin: false,
  },

  state: {
    loginMethod: "validate" as "check" | "login" | "validate",
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
          return showModal("暂不支持", "专项考试查询仅支持本科生", () => {
            this.$back();
          });

        const data = get<UnderSpecialExamResult[]>(SPECIAL_EXAM_DATA_KEY);

        if (data) this.setData({ data });
        else this.getSpecialExamScore();
      }
    }

    this.setData({ needLogin: !user.account });

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/grade/special",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  async getSpecialExamScore() {
    wx.showLoading({ title: "获取中" });

    try {
      const err = await ensureUnderStudyLogin(
        user.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await getUnderSpecialExam();

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        set(SPECIAL_EXAM_DATA_KEY, result.data, 3 * HOUR);

        this.setData({
          data: result.data.sort(
            (a, b) => new Date(b.time).getTime() - new Date(a.time).getTime(),
          ),
        });
        this.state.loginMethod = "check";
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", msg as string);
    }
  },
});

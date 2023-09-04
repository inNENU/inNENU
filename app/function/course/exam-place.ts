import { $Page, get, set } from "@mptool/all";

import type { ExamPlace } from "./typings.js";
import {
  getOnlineUnderExamPlace,
  getUnderExamPlace,
} from "./under-exam-place.js";
import { showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { EXAM_PLACE_DATA_KEY } from "../../config/keys.js";
import { LoginFailType, ensureUnderSystemLogin } from "../../login/index.js";
import { HOUR } from "../../utils/constant.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();

const PAGE_ID = "exam-place";
const PAGE_TITLE = "考场查询";

interface ExamPlaceData {
  name: string;
  exams: ExamPlace[];
}

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    data: <ExamPlaceData[]>[],

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
      firstPage: getCurrentPages().length === 1,
    });
  },

  onShow() {
    if (globalData.account) {
      if (!this.state.inited || this.data.needLogin) {
        if (globalData.userInfo!.typeId !== "bks")
          return showModal("暂不支持", "转专业计划查询仅支持本科生", () => {
            this.$back();
          });

        const data = get<ExamPlaceData[]>(EXAM_PLACE_DATA_KEY);

        if (data) this.setData({ data });
        else this.getExamPlace();
      }
    }

    this.setData({ needLogin: !globalData.account });

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/course/exam-place",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  getExamPlace() {
    wx.showLoading({ title: "获取中" });

    return ensureUnderSystemLogin(globalData.account!, "validate")
      .then((err) => {
        if (err) throw err.msg;

        return (
          useOnlineService(PAGE_ID)
            ? getOnlineUnderExamPlace
            : getUnderExamPlace
        )().then((res) => {
          wx.hideLoading();
          this.state.inited = true;

          if (res.success) {
            set(EXAM_PLACE_DATA_KEY, res.data, 3 * HOUR);

            this.setData({ data: res.data });
            this.state.loginMethod = "check";
          } else if (res.type === LoginFailType.Expired) {
            this.state.loginMethod = "login";
            showModal("登录过期", res.msg);
          } else {
            showModal("获取失败", res.msg);
          }
        });
      })
      .catch((msg: string) => {
        wx.hideLoading();
        showModal("获取失败", msg);
      });
  },
});

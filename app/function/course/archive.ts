import { $Page, set } from "@mptool/all";

import {
  getUnderStudentArchive,
  registerStudentArchive,
  useOnlineStudentArchive,
} from "./under-study-archive.js";
import { showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { STUDENT_ARCHIVE_KEY } from "../../config/keys.js";
import { LoginFailType } from "../../login/loginFailTypes.js";
import { ensureUnderSystemLogin } from "../../login/under-system.js";
import { HOUR } from "../../utils/constant.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();
const PAGE_ID = "study-archive";
const PAGE_TITLE = "学籍信息";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    stage: <"loading" | "info">"loading",

    path: "",
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
          "小程序本地暂无个人信息，请重新登录",
          () => {
            this.$go("account?update=true");
          },
        );
      }

      if (!this.state.inited || this.data.needLogin) {
        if (userInfo.typeId !== "bks")
          return showModal("暂不支持", `${PAGE_TITLE}仅支持本科生`, () => {
            this.$back();
          });

        this.getStudyArchive();
      }
    }

    this.setData({ needLogin: !globalData.account });

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/course/archive",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  async getStudyArchive() {
    wx.showLoading({ title: "获取中" });

    try {
      const err = await ensureUnderSystemLogin(
        globalData.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await (useOnlineService(PAGE_ID)
        ? useOnlineStudentArchive
        : getUnderStudentArchive)(undefined);

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        set(STUDENT_ARCHIVE_KEY, result, 3 * HOUR);

        this.setData({ stage: "info", ...result.info });
        this.state.loginMethod = "check";
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        wx.showModal({
          title: "登录过期",
          content: result.msg,
          confirmText: "重试",
          success: () => {
            this.getStudyArchive();
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

  async registerStudentArchive() {
    wx.showLoading({ title: "注册中" });

    try {
      const err = await ensureUnderSystemLogin(
        globalData.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await (useOnlineService(PAGE_ID)
        ? useOnlineStudentArchive
        : registerStudentArchive)(this.data.path);

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        showModal("注册成功", "本年度学籍注册成功", () =>
          this.setData({ stage: "loading" }, () => {
            this.getStudyArchive();
          }),
        );
        this.state.loginMethod = "check";
      } else if (result.type === LoginFailType.Expired) {
        this.state.loginMethod = "login";
        wx.showModal({
          title: "登录过期",
          content: result.msg,
          confirmText: "重试",
          success: () => {
            this.getStudyArchive();
          },
        });
      } else {
        showModal("注册失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("注册失败", <string>msg);
    }
  },

  createStudentArchive() {
    showModal("正在制作", "此功能正在制作中，敬请期待");
  },
});

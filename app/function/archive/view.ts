import { $Page, set } from "@mptool/all";

import { confirmAction, retryAction, showModal } from "../../api/index.js";
import { HOUR, STUDENT_ARCHIVE_KEY } from "../../config/index.js";
import {
  LoginFailType,
  ensureUnderSystemLogin,
  getUnderStudentArchive,
  registerUnderStudentArchive,
} from "../../service/index.js";
import { info, user } from "../../state/index.js";
import { getColor, showNotice } from "../../utils/index.js";

showModal;
const { envName } = info;
const PAGE_ID = "view-archive";
const PAGE_TITLE = "学籍信息";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    stage: "loading" as "loading" | "info",

    path: "",
    desc: "数据来自教务处教学服务系统",

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
          return showModal("暂不支持", `${PAGE_TITLE}仅支持本科生`, () => {
            this.$back();
          });

        this.getStudyArchive();
      }
    }

    this.setData({ needLogin: !user.account });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/archive/view",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  async getStudyArchive() {
    wx.showLoading({ title: "获取中" });

    try {
      const err = await ensureUnderSystemLogin(
        user.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await getUnderStudentArchive();

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        set(STUDENT_ARCHIVE_KEY, result, 3 * HOUR);

        this.setData({ stage: "info", ...result.info });
        this.state.loginMethod = "check";
      } else if (result.type === LoginFailType.Expired) {
        this.handleExpired(result.msg);
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", msg as string);
    }
  },

  async registerStudentArchive() {
    wx.showLoading({ title: "注册中" });

    try {
      const err = await ensureUnderSystemLogin(
        user.account!,
        this.state.loginMethod,
      );

      if (err) throw err.msg;

      const result = await registerUnderStudentArchive(this.data.path);

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
        this.handleExpired(result.msg);
      } else {
        showModal("注册失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("注册失败", msg as string);
    }
  },

  confirmRegister() {
    confirmAction(
      "注册学籍",
      () => {
        this.registerStudentArchive();
      },
      "您应已核对信息全部准确，注册后将无法修改！",
    );
  },

  createStudentArchive() {
    this.$go("create-archive");
  },

  handleExpired(content: string) {
    this.state.loginMethod = "login";
    retryAction("登录过期", content, () => this.getStudyArchive());
  },
});

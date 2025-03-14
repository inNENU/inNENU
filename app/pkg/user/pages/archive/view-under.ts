import { $Page, confirm, retry, set, showModal } from "@mptool/all";

import { HOUR, STUDENT_ARCHIVE_KEY } from "../../../../config/index.js";
import type { LoginMethod } from "../../../../service/index.js";
import { ActionFailType } from "../../../../service/index.js";
import { envName, info, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import {
  ensureUnderSystemLogin,
  getUnderStudentArchive,
  registerUnderStudentArchive,
} from "../../service/index.js";

const PAGE_ID = "under-archive-view";
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
          showModal("暂不支持", `${PAGE_TITLE}仅支持本科生`, () => {
            this.$back();
          });

          return;
        }

        this.getStudyArchive();
      }
    }

    this.setData({ needLogin: !user.account });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  async getStudyArchive() {
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

    const result = await getUnderStudentArchive();

    wx.hideLoading();
    this.state.inited = true;

    if (result.success) {
      set(STUDENT_ARCHIVE_KEY, result, 3 * HOUR);

      this.setData({ stage: "info", ...result.info });
      this.state.loginMethod = "check";
    } else if (result.type === ActionFailType.Expired) {
      this.handleExpired(result.msg);
    } else {
      showModal("获取失败", result.msg);
    }
  },

  async registerStudentArchive() {
    wx.showLoading({ title: "注册中" });

    const err = await ensureUnderSystemLogin(
      user.account!,
      this.state.loginMethod,
    );

    if (err) {
      wx.hideLoading();
      showModal("注册失败", err.msg);

      return;
    }

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
    } else if (result.type === ActionFailType.Expired) {
      this.handleExpired(result.msg);
    } else {
      showModal("注册失败", result.msg);
    }
  },

  confirmRegister() {
    confirm("注册学籍", "您应已核对信息全部准确，注册后将无法修改！", () => {
      this.registerStudentArchive();
    });
  },

  createStudentArchive() {
    this.$go("under-archive-create");
  },

  handleExpired(content: string) {
    this.state.loginMethod = "force";
    retry("登录过期", content, () => this.getStudyArchive());
  },
});

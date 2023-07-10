import { $Page } from "@mptool/enhance";
import { remove, set } from "@mptool/file";

import {
  type ListComponentConfig,
  type ListComponentItemConfig,
} from "../../../typings/components.js";
import { showModal, showToast } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import {
  ACCOUNT_INFO_KEY,
  COURSE_DATA_KEY,
  GRADE_DATA_KEY,
  UNDER_SYSTEM_COOKIE,
  USER_INFO_KEY,
} from "../../config/keys.js";
import { getInfo, login } from "../../utils/account.js";
import { type UserInfo } from "../../utils/app.js";
import { MONTH } from "../../utils/constant.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "account";
const PAGE_TITLE = "账号信息";

const EMPTY_CONTENT = [{ text: "暂无个人信息" }];

const getDisplay = (userInfo: UserInfo): ListComponentItemConfig[] => {
  const { id, name, email } = userInfo;

  return [
    {
      text: "学号",
      desc: id.toString(),
    },
    {
      text: "姓名",
      desc: name,
    },
    {
      text: "邮箱",
      desc: email,
    },
  ];
};

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    /** 导航栏 */
    nav: {
      title: "账号信息",
      statusBarHeight: globalData.info.statusBarHeight,
      from: "返回",
    },

    inputTitle: {
      text: "账号信息",
    },

    list: <ListComponentConfig>{
      header: false,
      items: EMPTY_CONTENT,
    },

    footer: {
      desc: "Mr.Hope 会严格遵守隐私协议的要求，您的账号、密码与个人信息将仅存储在本地，并在卸载 App或小程序时一并删除。Mr.Hope 不会收集并存储您的任何信息。",
    },

    id: "",
    password: "",
    isSaved: false,
    showPassword: false,

    name: "",
    email: "",
  },

  state: {
    shouldNavigateBack: false,
  },

  onLoad({ from = "返回", update }) {
    const { account, userInfo } = globalData;

    if (account)
      this.setData({
        from,
        id: account.id.toString(),
        password: account.password,
        isSaved: true,
      });
    if (userInfo)
      this.setData({
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "list.items": getDisplay(userInfo),
      });
    if (update) this.state.shouldNavigateBack = true;
  },

  onShow() {
    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/settings/about/about",
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  /** 输入成绩 */
  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    const { id } = currentTarget;
    const { value } = detail;

    this.setData({ [id]: value });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  save() {
    const { id, password } = this.data;

    if (!id || !password) {
      wx.showToast({ title: "请输入完整信息", icon: "error" });

      return;
    }

    wx.showLoading({ title: "验证中..." });

    login({ id: Number(id), password })
      .then((response) => {
        wx.hideLoading();
        if (response.status === "success") {
          const account = { id: Number(id), password };

          globalData.account = account;
          set(ACCOUNT_INFO_KEY, account, MONTH);

          wx.showLoading({ title: "获取信息" });
          getInfo(response.cookies).then((response) => {
            wx.hideLoading();
            if (response.status === "success") {
              const userInfo: UserInfo = {
                id: Number(id),
                name: response.name,
                email: response.email,
                grade: Number(id.substring(0, 4)),
              };

              showModal("登陆成功", "个人信息获取成功");
              set(USER_INFO_KEY, userInfo, MONTH);
              this.setData({
                isSaved: true,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "list.items": getDisplay(userInfo),
              });
            }
          });

          if (this.state.shouldNavigateBack) this.$back();
        } else {
          showModal("登陆失败", response.msg);
        }
      })
      .catch(() => {
        wx.hideLoading();
        showToast("验证失败");
      });
  },

  delete() {
    this.setData({
      id: "",
      password: "",
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "list.items": EMPTY_CONTENT,
      isSaved: false,
    });
    remove(ACCOUNT_INFO_KEY);
    remove(USER_INFO_KEY);
    remove(UNDER_SYSTEM_COOKIE);
    remove(COURSE_DATA_KEY);
    remove(GRADE_DATA_KEY);
    globalData.account = null;
    globalData.userInfo = null;
    showModal("删除成功", "已删除本地账号信息");
  },
});

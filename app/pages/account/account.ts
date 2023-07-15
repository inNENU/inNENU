import { $Page, remove, set } from "@mptool/all";

import {
  type ListComponentConfig,
  type ListComponentItemConfig,
} from "../../../typings/components.js";
import { cookieStore } from "../../api/cookie.js";
import { getInfo, login } from "../../api/login/account.js";
import { confirmAction, showModal, showToast } from "../../api/ui.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix, assets } from "../../config/info.js";
import {
  ACCOUNT_INFO_KEY,
  BORROW_BOOKS_KEY,
  CARD_BALANCE_KEY,
  COURSE_DATA_KEY,
  GRADE_DATA_KEY,
  USER_INFO_KEY,
} from "../../config/keys.js";
import { type UserInfo } from "../../utils/app.js";
import { MONTH } from "../../utils/constant.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "account";
const PAGE_TITLE = "统一身份认证信息";

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
    logo:
      globalData.env === "qq"
        ? `${assets}img/inNENU.png`
        : "/frameset/placeholder.png",

    /** 导航栏 */
    nav: {
      title: PAGE_TITLE,
      statusBarHeight: globalData.info.statusBarHeight,
      from: "返回",
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
    path: "/pages/account/account",
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

    wx.showLoading({ title: "验证中" });

    login({ id: Number(id), password })
      .then((res) => {
        wx.hideLoading();
        if (res.success) {
          const account = { id: Number(id), password };

          globalData.account = account;
          set(ACCOUNT_INFO_KEY, account, MONTH);

          wx.showLoading({ title: "获取信息" });

          getInfo().then((res) => {
            wx.hideLoading();
            if (res.success) {
              const userInfo: UserInfo = {
                id: Number(id),
                name: res.name,
                email: res.email,
                grade: Number(id.substring(0, 4)),
              };

              showModal("登陆成功", "个人信息获取成功");
              set(USER_INFO_KEY, userInfo, MONTH);
              globalData.userInfo = userInfo;
              this.setData({
                isSaved: true,
                // eslint-disable-next-line @typescript-eslint/naming-convention
                "list.items": getDisplay(userInfo),
              });

              if (this.state.shouldNavigateBack) this.$back();
            }
          });
        } else {
          showModal("登陆失败", res.msg);
        }
      })
      .catch(() => {
        wx.hideLoading();
        showToast("验证失败");
      });
  },

  delete() {
    confirmAction("删除账号(会清除本地的全部个人信息与数据且无法恢复)", () => {
      // account data
      remove(ACCOUNT_INFO_KEY);
      remove(USER_INFO_KEY);
      globalData.account = null;
      globalData.userInfo = null;
      this.setData({
        id: "",
        password: "",
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "list.items": EMPTY_CONTENT,
        isSaved: false,
      });

      // cookies
      cookieStore.clear();
      // data
      remove(BORROW_BOOKS_KEY);
      remove(CARD_BALANCE_KEY);
      remove(COURSE_DATA_KEY);
      remove(GRADE_DATA_KEY);

      showModal("删除成功", "已删除本地账号信息");
    });
  },
});

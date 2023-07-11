import { $Page } from "@mptool/enhance";

import { getNoticeList } from "./api.js";
import { type NoticeItem } from "./typings.js";
import { getActionCookie } from "../../api/action.js";
import { type AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/info.js";
import { getColor } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

const PAGE_ID = "notice-list";
const PAGE_TITLE = "学校通知";

$Page(PAGE_ID, {
  data: {
    nav: {
      title: "学校通知",
    },
    status: <"error" | "login" | "success">"success",
    notices: <NoticeItem[]>[],
    currentPage: 1,
    totalPage: 1,
  },

  state: {
    inited: false,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      darkmode: globalData.darkmode,
      theme: globalData.theme,
    });
  },

  onShow() {
    if (!this.state.inited) this.getNoticeList(1, true);
    else if (globalData.account) {
      if (this.data.status === "login") this.getNoticeList(1, true);
    } else this.setData({ status: "login" });
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: `/function/notice/list`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  getNoticeList(page = 1, check = false) {
    if (globalData.account) {
      wx.showLoading({ title: "获取中" });

      getActionCookie(globalData.account, check).then((res) => {
        if (res.success)
          getNoticeList({ cookies: res.cookies, limit: 20, page }).then(
            (res) => {
              wx.hideLoading();
              this.state.inited = true;
              if (res.success) {
                this.setData({
                  notices: res.data,
                  page,
                  currentPage: res.pageIndex,
                  totalPage: res.totalPage,
                  status: "success",
                });
              } else this.setData({ status: "error" });
            },
          );
        else {
          wx.hideLoading();
          this.setData({ status: "error" });
        }
      });
    } else this.setData({ status: "login" });
  },

  login() {
    this.$go("account?from=学校通知&update=true");
  },

  prevPage() {
    this.getNoticeList(this.data.currentPage - 1);
  },

  nextPage() {
    this.getNoticeList(this.data.currentPage + 1);
  },

  viewNotice({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;
    const { title, id } = this.data.notices[index];

    this.$go(`notice-detail?from=学校通知&title=${title}&id=${id}`);
  },
});

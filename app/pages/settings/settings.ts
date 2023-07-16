import { $Page, ls, rm } from "@mptool/all";

import { size } from "./size.js";
import type {
  FunctionalListComponentConfig,
  PageDataWithContent,
  PickerListComponentItemConfig,
} from "../../../typings/index.js";
import { confirmAction, showModal, showToast } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { getColor, popNotice, setPage } from "../../utils/page.js";
import { downloadResource } from "../../utils/resource.js";

const { globalData } = getApp<AppOption>();
const { envName, version } = globalData;

const PAGE_TITLE = `${envName}设置`;

$Page("settings", {
  data: {
    theme: globalData.theme,
    darkmode: globalData.darkmode,
    page: <PageDataWithContent>{
      title: PAGE_TITLE,
      desc: `当前版本: ${version}`,
      grey: true,
      content: [
        {
          tag: "functional-list",
          header: "主题设置",
          items: [
            {
              type: "picker",
              text: "当前主题",
              select: ["ios", "android", "nenu", "weui"],
              key: "themeNum",
              handler: "updateTheme",
              single: true,
            },
          ],
        },
        {
          tag: "list",
          header: "空间占用",
          items: [
            { text: `${envName}体积`, desc: `${size}KB` },
            { text: "数据缓存", desc: "获取中..." },
            { text: "文件系统", desc: "获取中..." },
          ],
        },
        {
          tag: "functional-list",
          header: "内容更新",
          items: [
            {
              text: "内容更新提示",
              type: "switch",
              key: "resourceNotify",
              handler: "notify",
            },
            {
              text: "更新资源文件",
              type: "button",
              handler: "updateResource",
            },
          ],
        },
        {
          tag: "functional-list",
          header: "重置",
          items: [
            {
              text: `清除${envName}数据`,
              type: "button",
              handler: "clearData",
            },
            {
              text: `清除${envName}文件`,
              type: "button",
              handler: "clearFiles",
            },
            { text: `初始化${envName}`, type: "button", handler: "resetApp" },
            {
              text: `退出${envName}`,
              type: "navigator",
              openType: "exit",
              target: "miniProgram",
            },
          ],
          foot: `如果${envName}出现问题请尝试重置${envName}`,
        },
      ],
    },
  },

  onLoad() {
    setPage({ option: { id: "settings" }, ctx: this }, this.data.page);

    popNotice("settings");
  },

  onShow() {
    this.setStorageStat();
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  /** 设置存储信息 */
  setStorageStat() {
    wx.getStorageInfo({
      success: ({ currentSize }) => {
        // 写入存储大小
        this.setData({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "page.content[1].items[1].desc": `${(currentSize / 1024).toFixed(
            2,
          )}MB/10MB`,
        });
      },
    });

    // FIXME: It will stuck devTools
    if (globalData.info.platform !== "devtools")
      wx.getFileSystemManager().stat({
        path: wx.env.USER_DATA_PATH,
        recursive: true,
        success: ({ stats }) => {
          // FIXME: https://github.com/wechat-miniprogram/api-typings/issues/226
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const fileSize = (
            stats as unknown as {
              path: string;
              stats: WechatMiniprogram.Stats;
            }[]
          ).reduce((total, element) => element.stats.size + total, 0);

          // 写入文件大小
          this.setData({
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "page.content[1].items[2].desc": `${(
              fileSize /
              1024 /
              1024
            ).toFixed(2)}MB/10MB`,
          });
        },
      });
  },

  updateTheme(value: string) {
    // get the updated theme
    const theme = (
      (
        (this.data.page.content[0] as FunctionalListComponentConfig)
          .items[0] as PickerListComponentItemConfig
      ).select as string[]
    )[Number(value)];

    globalData.theme = theme;
    wx.setStorageSync("theme", theme);
    this.setData({ color: getColor(this.data.page.grey), theme });
    this.$emit("theme", theme);

    // debug
    console.info(`Switched to ${theme} theme`);
  },

  /** 刷新所有资源 */
  updateResource() {
    confirmAction("更新资源文件", () => {
      downloadResource("function-guide-icon-intro");
    });
  },

  /** 清除数据 */
  clearData() {
    confirmAction(`清除${envName}数据`, () => {
      wx.clearStorageSync();
      showToast("数据清除完成");
    });
  },

  /** 清除文件 */
  clearFiles() {
    confirmAction(`清除${envName}文件`, () => {
      wx.showLoading({ title: "删除中", mask: true });

      ls("").forEach((filePath) => rm(filePath));

      wx.hideLoading();
    });
  },

  /** 初始化 */
  resetApp() {
    confirmAction(`初始化${envName}`, () => {
      // 显示提示
      wx.showLoading({ title: "初始化中", mask: true });

      // 清除文件系统文件与数据存储
      ls("").forEach((filePath) => rm(filePath));
      wx.clearStorageSync();

      // 隐藏提示
      wx.hideLoading();
      // 提示用户重启
      showModal(
        `${envName}初始化完成`,
        `请单击 “退出${envName}按钮” 退出${envName}。`,
      );
    });
  },

  notify(status: boolean) {
    showModal(
      `已${status ? "打开" : "关闭"}更新提示`,
      status
        ? "您将在内容更新时收到提醒。"
        : "7天内，您不会再收到内容更新的提醒。\n警告: 这会导致您无法获取7天内新增与修正的内容，带来的后果请您自负!",
    );
  },
});

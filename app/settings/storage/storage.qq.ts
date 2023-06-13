import { $Page } from "@mptool/enhance";
import { ls, rm } from "@mptool/file";

import { type PageDataWithContent } from "../../../typings/index.js";
import { type AppOption } from "../../app.js";
import { confirmAction, modal, tip } from "../../utils/api.js";
import { popNotice, setPage } from "../../utils/page.js";
import { downloadResource } from "../../utils/resource.js";

const { globalData } = getApp<AppOption>();

$Page("storage", {
  data: {
    theme: globalData.theme,
    darkmode: globalData.darkmode,
    page: <PageDataWithContent>{
      title: "存储设置",
      desc: `当前版本: ${globalData.version}`,
      grey: true,
      content: [
        {
          tag: "list",
          header: "空间占用",
          items: [
            { text: "小程序体积", desc: "419KB" },
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
            { text: "清除小程序数据", type: "button", handler: "clearData" },
            { text: "清除小程序文件", type: "button", handler: "clearFiles" },
            { text: "初始化小程序", type: "button", handler: "resetApp" },
            {
              text: "退出小程序",
              type: "navigator",
              openType: "exit",
              target: "miniProgram",
            },
          ],
          foot: "如果小程序出现问题请尝试重置小程序",
        },
      ],
    },
  },

  onLoad() {
    setPage({ option: { id: "storage" }, ctx: this }, this.data.page);

    popNotice("storage");
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
          "page.content[0].items[1].desc": `${currentSize}KB/10240KB`,
        });
      },
    });

    let fileSize = 0;

    wx.getFileSystemManager().stat({
      path: wx.env.USER_DATA_PATH,
      recursive: true,
      success: ({ stats }) => {
        // FIXME: https://github.com/wechat-miniprogram/api-typings/issues/226
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (
          stats as unknown as {
            path: string;
            stats: WechatMiniprogram.Stats;
          }[]
        ).forEach((element) => {
          fileSize += element.stats.size;
        });

        // 写入文件大小
        this.setData({
          // eslint-disable-next-line @typescript-eslint/naming-convention
          "page.content[0].items[2].desc": `${Math.ceil(
            fileSize / 1024
          )}KB/10240KB`,
        });
      },
    });
  },

  /** 刷新所有资源 */
  updateResource() {
    confirmAction("更新资源文件", () => {
      downloadResource("function-guide-icon-intro");
    });
  },

  /** 清除小程序数据 */
  clearData() {
    confirmAction("清除小程序数据", () => {
      wx.clearStorageSync();
      tip("数据清除完成");
    });
  },

  /** 清除小程序文件 */
  clearFiles() {
    confirmAction("清除小程序文件", () => {
      wx.showLoading({ title: "删除中", mask: true });

      ls("").forEach((filePath) => rm(filePath));

      wx.hideLoading();
    });
  },

  /** 初始化小程序 */
  resetApp() {
    confirmAction("初始化小程序", () => {
      // 显示提示
      wx.showLoading({ title: "初始化中", mask: true });

      // 清除文件系统文件与数据存储
      ls("").forEach((filePath) => rm(filePath));
      wx.clearStorageSync();

      // 隐藏提示
      wx.hideLoading();
      // 提示用户重启
      modal("小程序初始化完成", "请单击 “退出小程序按钮” 退出小程序");
    });
  },

  notify(status: boolean) {
    modal(
      `已${status ? "打开" : "关闭"}更新提示`,
      status
        ? "您将在内容更新时收到提醒。"
        : "7天内，您不会再收到内容更新的提醒。\n警告: 这会导致您无法获取7天内新增与修正的内容，带来的后果请您自负!"
    );
  },
});

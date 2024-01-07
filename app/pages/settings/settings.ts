import { $Page } from "@mptool/all";

import { size } from "./size.js";
import type {
  FunctionalListComponentConfig,
  PageDataWithContent,
  PickerListComponentItemConfig,
} from "../../../typings/index.js";
import { confirmAction, showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { supportRedirect } from "../../service/utils.js";
import { getColor, popNotice, setPage } from "../../utils/page.js";
import { resetApp } from "../../utils/reset.js";
import { defaultResources, downloadResource } from "../../utils/resource.js";

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
          header: "外观与布局",
          items: [
            {
              type: "picker",
              text: "当前主题",
              select: ["ios", "android", "nenu", "weui"],
              key: "themeNum",
              handler: "updateTheme",
              single: true,
            },
            {
              text: "自定义主页小组件",
              url: "widget-settings",
            },
          ],
        },
        {
          tag: "list",
          header: "小程序功能",
          items: [
            {
              text: "本地登录",
              desc: `${supportRedirect ? "" : "不"}支持`,
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
            { text: `重置${envName}`, type: "button", handler: "resetApp" },
            {
              text: `退出${envName}`,
              type: "navigator",
              openType: "exit",
              target: "miniProgram",
              hidden: typeof wx.restartMiniProgram === "function",
            },
          ],
          footer: `如果${envName}出现问题请尝试重置${envName}`,
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
          "page.content[2].items[1].desc": `${(currentSize / 1024).toFixed(
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
            "page.content[2].items[2].desc": `${(
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
      downloadResource(defaultResources);
    });
  },

  /** 初始化 */
  resetApp,

  notify(status: boolean) {
    showModal(
      `已${status ? "打开" : "关闭"}更新提示`,
      status
        ? "您将在内容更新时收到提醒。"
        : "7天内，您不会再收到内容更新的提醒。\n警告: 这会导致您无法获取7天内新增与修正的内容，带来的后果请您自负!",
    );
  },
});

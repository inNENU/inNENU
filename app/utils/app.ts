/* eslint-disable max-lines */
import { emitter, get, logger, writeJSON } from "@mptool/all";

import { platformActions } from "./app-platform.js";
import { defaultResources, downloadResource } from "./resource.js";
import type { Data, ServiceSettings } from "./settings.js";
import { updateApp } from "./update.js";
import type { PageData, VersionInfo } from "../../typings/index.js";
import { request, showToast } from "../api/index.js";
import {
  ACCOUNT_INFO_KEY,
  INITIALIZED_KEY,
  USER_INFO_KEY,
  defaultAppConfig,
  server,
  version,
} from "../config/index.js";
import { login } from "../login/app.js";

export type AppID =
  | "wx33acb831ee1831a5"
  | "wx9ce37d9662499df3"
  | "wx69e79c3d87753512"
  | 1109559721;
export type Env = "app" | "qq" | "wx" | "web";

export interface AccountBasicInfo {
  /** 学号 */
  id: number;
  /** 密码 */
  password: string;
}

export interface UserInfo {
  /** 姓名 */
  name: string;
  /** 学号 */
  id: number;
  /** 登录别名 */
  alias: string;
  /** 年级 */
  grade: number;
  // /** 邮箱 */
  // email: string;
}

export interface MusicState {
  /** 是否正在播放 */
  playing: boolean;
  /** 播放歌曲序号 */
  index: number;
}

export interface PageState {
  /** 页面数据 */
  data?: PageData;
  /** 页面标识符 */
  id?: string;
}

export interface GlobalData {
  /** 运行环境 */
  env: Env;
  /** 运行环境名称 */
  envName: string;
  /** 版本号 */
  version: string;
  /** 账号信息 */
  account: AccountBasicInfo | null;
  userInfo: UserInfo | null;
  /** 播放器信息 */
  music: MusicState;
  /** 页面信息 */
  page: PageState;
  /** 启动时间 */
  startupTime: number;
  /** 正在应用的主题 */
  theme: string;
  /** 夜间模式开启状态 */
  darkmode: boolean;
  /** 设备信息 */
  info: WechatMiniprogram.SystemInfo;
  /** 小程序 appid */
  appID: AppID;
  /** 用户 OPENID */
  openid: string;
  /** 是否能复制 */
  selectable: boolean;
  data: Omit<Data, "service" | "notice" | "update"> | null;
  service: ServiceSettings;
}

/** 初始化小程序 */
export const initializeApp = (): void => {
  // 提示用户正在初始化
  wx.showLoading({ title: "初始化中...", mask: true });
  logger.info("First launch");

  // 写入预设数据
  Object.entries(defaultAppConfig).forEach(([key, data]) => {
    wx.setStorageSync(key, data);
  });

  // 主题为 auto
  if (defaultAppConfig.theme === "auto") {
    let num;
    let theme;
    const { platform } = wx.getSystemInfoSync();

    // 根据平台设置主题
    switch (platform) {
      case "android":
        theme = "android";
        num = 1;
        break;
      case "windows":
        theme = "nenu";
        num = 3;
        break;
      case "ios":
      default:
        theme = "ios";
        num = 0;
    }

    wx.setStorageSync("theme", theme);
    wx.setStorageSync("themeNum", num);
  } else {
    wx.setStorageSync("theme", defaultAppConfig.theme);
    wx.setStorageSync("themeNum", defaultAppConfig.themeNum);
  }

  downloadResource(defaultResources, false)
    .then(() => {
      // 下载资源文件并写入更新时间
      const timeStamp = new Date().getTime();

      wx.setStorageSync("resource-update-time", Math.round(timeStamp / 1000));

      return request<VersionInfo>(`${server}service/version.php`);
    })
    .then((data) => {
      console.log("Version info", data);
      writeJSON("resource-version", data.version);
      // 成功初始化
      wx.setStorageSync(INITIALIZED_KEY, true);
      emitter.emit("inited");
      wx.hideLoading();
    });
};

export const getGlobalData = (): GlobalData => {
  // 获取设备与运行环境信息
  const info = wx.getSystemInfoSync();
  const env = "miniapp" in wx ? "app" : info.AppPlatform || "wx";

  return {
    version,
    account: get<AccountBasicInfo | undefined>(ACCOUNT_INFO_KEY) || null,
    userInfo: get<UserInfo | undefined>(USER_INFO_KEY) || null,
    music: { playing: false, index: 0 },
    page: {
      data: {},
      id: "",
    },
    startupTime: new Date().getTime(),
    env,
    envName: env === "app" ? "App" : "小程序",
    theme: wx.getStorageSync<string>("theme") || "ios",
    info,
    data: null,
    darkmode: info.theme === "dark",
    appID: wx.getAccountInfoSync().miniProgram.appId as AppID,
    openid: "",
    selectable: wx.getStorageSync<boolean>("selectable") || false,
    service: wx.getStorageSync<ServiceSettings>("service") || {
      forceOnline: false,
    },
  };
};

/** 注册全局监听 */
const registerActions = (globalData: GlobalData): void => {
  const debug = wx.getStorageSync<boolean | undefined>("debugMode") || false;

  wx.setEnableDebug({ enableDebug: debug });
  (wx.env as Record<string, unknown>).DEBUG = debug;

  // 获取网络信息
  wx.getNetworkType({
    success: ({ networkType }) => {
      if (networkType === "none") showToast("您的网络状态不佳");
    },
  });

  if (wx.canIUse("onThemeChange"))
    wx.onThemeChange(({ theme }) => {
      globalData.darkmode = theme === "dark";
    });

  // 设置内存不足警告
  wx.onMemoryWarning((res) => {
    console.warn("Memory warning received.");
    wx.reportEvent?.("memory_warning", {
      level: res?.level || 0,
    });
  });

  // 监听网络状态
  wx.onNetworkStatusChange(({ isConnected }) => {
    // 显示提示
    if (!isConnected) {
      showToast(`网络连接中断,部分${globalData.envName}功能暂不可用`);
      wx.setStorageSync("networkError", true);
    } else if (wx.getStorageSync("network")) {
      wx.setStorageSync("networkError", false);
      showToast("网络链接恢复");
    }
  });

  // 监听用户截屏
  if (
    wx.canIUse("onUserCaptureScreen") &&
    wx.getStorageSync("capture-screen") !== "never"
  ) {
    // avoid issues on QQ
    let pending = false;

    wx.onUserCaptureScreen(() => {
      const status = wx.getStorageSync<"never" | "noticed" | undefined>(
        "capture-screen",
      );

      if (status !== "never" && !pending) {
        pending = true;
        wx.showModal({
          title: "善用小程序分享",
          content:
            "您可以点击右上角选择分享到好友、分享到朋友圈/空间\n您也可以点击页面右下角的分享图标，选择保存二维码分享小程序",
          showCancel: status === "noticed",
          cancelText: "不再提示",
          theme: "day",
          success: ({ cancel, confirm }) => {
            if (confirm) {
              wx.setStorageSync("capture-screen", "noticed");
            } else if (cancel) {
              wx.setStorageSync("capture-screen", "never");
              if (wx.canIUse("offUserCaptureScreen")) wx.offUserCaptureScreen();
            }

            pending = false;
          },
        });
      }
    });
  }

  // 更新窗口大小
  wx.onWindowResize(({ size }) => {
    globalData.info = { ...globalData.info, ...size };
  });
};

/**
 * 小程序启动时的运行函数
 *
 * 负责检查通知与小程序更新，注册网络、内存、截屏的监听
 *
 * @param globalData 小程序的全局数据
 */
export const startup = (globalData: GlobalData): void => {
  registerActions(globalData);
  updateApp(globalData);
  login(globalData.appID, globalData.env, (openid) => {
    globalData.openid = openid;
  });
  platformActions(globalData);
};

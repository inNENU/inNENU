import { assets } from "../config/index.js";

const systemInfo = wx.getSystemInfoSync();

/** 小程序 appid */
/*@__PURE__*/
export const appID = wx.getAccountInfoSync().miniProgram.appId as AppID;

/** 小程序 appid */
export type AppID =
  | "wx33acb831ee1831a5"
  | "wx2550e3fd373b79a8"
  | "wx69e79c3d87753512"
  | 1109559721;

/** 运行环境 */
export type Env = "app" | "qq" | "wx";

/** 运行环境 */
/*@__PURE__*/
export const env: Env =
  "miniapp" in wx ? "app" : systemInfo.AppPlatform || "wx";

/** 运行环境名称 */
export const envName = env === "app" ? "App" : "小程序";

export const logo =
  env === "qq" ? `${assets}img/inNENU.png` : "/frameset/placeholder.png";

export const platform = systemInfo.platform;

export const menuSpace =
  platform !== "windows" && env !== "app"
    ? (wx.getMenuButtonBoundingClientRect?.().width ?? 80)
    : 0;

export interface InfoState extends Omit<WechatMiniprogram.SystemInfo, "theme"> {
  /** 夜间模式 */
  darkmode: boolean;
  /** 启动时间 */
  startupTime: number;
  /** 当前主题 */
  theme: string;
  /** 是否能复制 */
  selectable: boolean;
}

const infoState: InfoState = {
  ...systemInfo,
  darkmode: systemInfo.theme === "dark",
  startupTime: Date.now(),
  theme: wx.getStorageSync<string>("theme") || "ios",
  selectable: wx.getStorageSync<boolean>("selectable") || false,
};

// FIXME: App does not support this API
if (env !== "app")
  // 更新窗口大小
  wx.onWindowResize(({ size }) => {
    const { windowHeight, windowWidth } = size;

    infoState.windowHeight = windowHeight;
    infoState.windowWidth = windowWidth;
  });

// 监听主题
wx.onThemeChange?.(({ theme }) => {
  infoState.darkmode = theme === "dark";
});

// 重新设置
wx.onAppShow(() => {
  infoState.darkmode =
    (wx.getAppBaseInfo || wx.getSystemInfoSync)().theme === "dark";
});

export const info: Readonly<InfoState> = infoState;

export const updateSelectable = (selectable: boolean): void => {
  infoState.selectable = selectable;
};

export const updateTheme = (theme: string): void => {
  infoState.theme = theme;
  wx.setStorageSync("theme", theme);
};

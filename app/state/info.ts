import { getWindowInfo } from "@mptool/all";

const { theme, ...defaultAppInfo } = (
  wx.getAppBaseInfo || wx.getSystemInfoSync
)();

export const windowInfoState = getWindowInfo();

/** 运行环境 */
/*@__PURE__*/
export const env: Env =
  "miniapp" in wx
    ? "app"
    : (wx as WechatMiniprogram.Wx).getSystemInfoSync().AppPlatform || "wx";

/** 小程序 appid */
export type AppID =
  | "wx33acb831ee1831a5"
  | "wx2550e3fd373b79a8"
  | "wx0009f7cdfeefa3da"
  | 1109559721;

const accountInfo = wx.getAccountInfoSync();

/** 小程序 appid */
/*@__PURE__*/
export const appID =
  env === "app"
    ? // FIXME: Current devtool SDK can not return appid correctly
      (accountInfo.host.miniappId as AppID) || "wx0009f7cdfeefa3da"
    : (accountInfo.miniProgram.appId as AppID);

export const isCompany = appID === "wx2550e3fd373b79a8";

/** 运行环境 */
export type Env = "app" | "qq" | "wx";

/** 运行环境名称 */
/*@__PURE__*/
export const envName = env === "app" ? "App" : "小程序";

/** 运行环境名称 */
/*@__PURE__*/
export const { platform } = (wx.getDeviceInfo || wx.getSystemInfoSync)();

export const menuSpace =
  platform !== "windows" && env !== "app"
    ? (wx.getMenuButtonBoundingClientRect?.().width ?? 80)
    : 0;

export interface AppInfo extends Omit<WechatMiniprogram.AppBaseInfo, "theme"> {
  /** 夜间模式 */
  darkmode: boolean;
}

const appInfoState: AppInfo = {
  ...defaultAppInfo,
  darkmode: theme === "dark",
};

export const appInfo: Readonly<AppInfo> = appInfoState;

wx.onThemeChange?.(({ theme }) => {
  appInfoState.darkmode = theme === "dark";
});
wx.onAppShow(() => {
  appInfoState.darkmode =
    (wx.getAppBaseInfo || wx.getSystemInfoSync)().theme === "dark";
});

export const windowInfo: Readonly<WechatMiniprogram.WindowInfo> =
  windowInfoState;

// Note: App does not support this API
if (env !== "app")
  // 更新窗口大小
  wx.onWindowResize(({ size }) => {
    const { windowHeight, windowWidth } = size;

    windowInfoState.windowHeight = windowHeight;
    windowInfoState.windowWidth = windowWidth;
  });

export interface InfoState {
  /** 启动时间 */
  startupTime: number;
  /** 当前主题 */
  theme: string;
  /** 是否能复制 */
  selectable: boolean;
}

const infoState: InfoState = {
  startupTime: Date.now(),
  theme: wx.getStorageSync<string>("theme") || "ios",
  selectable: wx.getStorageSync<boolean>("selectable") || false,
};

export const info: Readonly<InfoState> = infoState;

export const updateSelectable = (selectable: boolean): void => {
  infoState.selectable = selectable;
};

export const updateTheme = (theme: string): void => {
  infoState.theme = theme;
  wx.setStorageSync("theme", theme);
};

export type AppID =
  | "wx33acb831ee1831a5"
  | "wx9ce37d9662499df3"
  | "wx69e79c3d87753512"
  | 1109559721;

export type Env = "app" | "qq" | "wx" | "web";

export type Info = Readonly<
  Omit<WechatMiniprogram.SystemInfo, "theme"> & {
    /** 小程序 appid */
    appID: AppID;
    darkmode: boolean;
    /** 运行环境 */
    env: Env;
    /** 运行环境名称 */
    envName: string;
    /** 启动时间 */
    startupTime: number;
    /** 当前主题 */
    theme: string;
    /** 是否能复制 */
    selectable: boolean;
  }
>;

const systemInfo = wx.getSystemInfoSync();

const env: Env = "miniapp" in wx ? "app" : systemInfo.AppPlatform || "wx";

const envName = env === "app" ? "App" : "小程序";

const info: Info = {
  ...systemInfo,
  appID: wx.getAccountInfoSync().miniProgram.appId as AppID,
  darkmode: systemInfo.theme === "dark",
  env,
  envName,
  startupTime: Date.now(),
  theme: wx.getStorageSync<string>("theme") || "ios",
  selectable: wx.getStorageSync<boolean>("selectable") || false,
};

// 更新窗口大小
wx.onWindowResize(({ size }) => {
  const { windowHeight, windowWidth } = size;

  // @ts-ignore
  info.windowHeight = windowHeight;
  // @ts-ignore
  info.windowWidth = windowWidth;
});

// 监听主题
wx.onThemeChange?.(({ theme }) => {
  // @ts-ignore
  info.darkmode = theme === "dark";
});

export { info };

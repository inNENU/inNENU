/** 小程序服务器地址 */
export const assets = "https://assets.innenu.com/";
export const server = "https://mp.innenu.com/";

/** 小程序版本 */
export const version = "0.0.1";

/** App初始化选项 */
export interface AppConfig {
  /** 是否开启夜间模式 */
  darkmode?: boolean;
  /** 资源更新提示 */
  resourceNotify?: boolean;
  /** 调试模式 */
  debugMode?: boolean;
  /** 开发者模式开启状态 */
  developMode?: boolean;
  [props: string]: string | boolean | number | undefined;
}

/** 小程序配置 */
export const appConfig: AppConfig = {
  theme: "ios",
  themeNum: 0,
  /** 是否开启夜间模式 */
  darkmode: false,
  /** 资源更新提示 */
  resourceNotify: true,
  /** 调试模式 */
  debugMode: true,
  /** 开发者模式开启状态 */
  developMode: true,
};

export const appName = "in东师";

export const appCoverPrefix = `${assets}img/inNENU`;

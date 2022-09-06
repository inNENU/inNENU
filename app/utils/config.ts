/** 小程序服务器地址 */
export const assets = "https://assets.innenu.com/";
export const server = "https://mp.innenu.com/";

/** 小程序版本 */
export const version = "5.3.2";

/** App初始化选项 */
export interface AppConfig {
  [props: string]: string | boolean | number;
}

/** 小程序配置 */
export const appConfig: AppConfig = {
  theme: "ios",
  themeNum: 0,
  /** 是否开启夜间模式 */
  darkmode: false,
  /** 图标更新提示 */
  resourceNotify: true,
  /** 开发者模式开启状态 */
  developMode: false,
};

export const appName = "in东师";

export const appCoverPrefix = `${assets}img/inNENU`;

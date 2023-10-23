/** App初始化选项 */
export interface AppConfig {
  /** 资源更新提示 */
  resourceNotify?: boolean;
  /** 调试模式 */
  debugMode?: boolean;
  /** 开发者模式开启状态 */
  developMode?: boolean;
  [props: string]: string | boolean | number | undefined;
}

/** 小程序配置 */
export const defaultAppConfig: AppConfig = {
  theme: "auto",
  themeNum: 0,
  /** 资源更新提示 */
  resourceNotify: true,
  /** 调试模式 */
  debugMode: false,
  /** 开发者模式开启状态 */
  developMode: false,
};

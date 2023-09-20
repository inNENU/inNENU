/* eslint-disable */
declare namespace WechatMiniprogram {
  interface DonutLaunchMiniProgramCallbackResult {
    /** 返回的数据 */
    data: unknown;
  }

  interface DonutOpenUrlOptions {
    /** 跳转的目标 App 路径，该参数的 Scheme 的前缀需与在多端应用控制台配置的一致 */
    url: string;
    /** 成功回调 */
    success?: (res: DonutLaunchMiniProgramCallbackResult) => void;
  }

  interface DonutLaunchMiniProgramOptions {
    /** 要打开的小程序的原始 ID */
    userName: string;
    /** 打开的页面路径，如果为空则打开首页 */
    path?: string;
    /**
     * 可选打开 0-正式版，1-开发版，2-体验版
     * @default 0
     */
    miniprogramType?: 0 | 1 | 2;
    /** 成功回调 */
    success?: (res: DonutLaunchMiniProgramCallbackResult) => void;
  }

  interface DonutInstallAppOptions {
    /** Apk 的文件路径 */
    filePath: string;
  }

  interface Wx {
    /** 多端框架接口 */
    miniapp: {
      /** 启动小程序 */
      launchMiniProgram: (options: DonutLaunchMiniProgramOptions) => void;
      /** 安装 Apk，仅 Android */
      installApp: (options: DonutInstallAppOptions) => void;
      /** openUrl */
      openUrl: (options: DonutOpenUrlOptions) => void;
    };
  }
}

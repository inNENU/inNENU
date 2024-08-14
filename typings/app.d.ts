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

  interface DonutRegistOpenUrlParams {
    action: "scheme" | "webpageURL" | "opensdkOnRep";
    data: {
      url: string;
      host: string;
      path: string;
      query: string;
    };
  }

  interface AppBaseInfoHost {
    /** 多端应用的 Id ；SDK >= 1.4.X 新增返回该字段 */
    miniappId: string;
    /** 多端应用资源包的 Id ；SDK >= 1.4.X 新增返回该字段 */
    moduleId: string;
    /** 运行环境，值为 "SAAASDK" */
    env: string;
    /** 对应 Android 应用的包名，Android 系统时返回 */
    packageName?: string;
    /** 对应 iOS 的 Bundle ID ，iOS 系统时返回 */
    bundleIdentifier?: string;
    /** SDK 版本 */
    sdkVersion: string;
    /** SDK 版本号数字值 */
    version: string;
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
      /** 监听进入App的事件，并获取参数 */
      registOpenURL: (
        callback: (params: DonutRegistOpenUrlParams) => void,
      ) => void;
    };
  }
}

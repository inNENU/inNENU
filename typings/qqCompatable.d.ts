declare namespace WechatMiniprogram {
  interface SystemInfo {
    /** 运行环境 */
    // eslint-disable-next-line @typescript-eslint/naming-convention
    AppPlatform: "qq" | undefined;
  }

  interface LaunchOptionsApp {
    /** 群信息hash值 */
    entryDataHash?: string;
  }

  interface AuthSetting {
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "setting.addFriend"?: boolean;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    "scope.qqrun"?: boolean;
  }

  /** 接口调用结束的回调函数(调用成功、失败都会执行) */
  type SaveAppToDesktopCompleteCallback = (res: GeneralCallbackResult) => void;
  /** 接口调用失败的回调函数 */
  type SaveAppToDesktopFailCallback = (res: GeneralCallbackResult) => void;
  /** 接口调用成功的回调函数 */
  type SaveAppToDesktopSuccessCallback = (res: GeneralCallbackResult) => void;

  interface SaveAppToDesktopOption {
    /** 接口调用结束的回调函数(调用成功、失败都会执行) */
    complete?: SaveAppToDesktopCompleteCallback;
    /** 接口调用失败的回调函数 */
    fail?: SaveAppToDesktopFailCallback;
    /** 接口调用成功的回调函数 */
    success?: SaveAppToDesktopSuccessCallback;
  }

  interface GetGroupInfoCallback {
    /** 是否为群管理员 */
    isGroupManager: boolean;
    errMsg: string;
  }

  /** 接口调用结束的回调函数(调用成功、失败都会执行) */
  type GetGroupInfoCompleteCallback = (res: GetGroupInfoCallback) => void;
  /** 接口调用失败的回调函数 */
  type GetGroupInfoFailCallback = (res: GetGroupInfoCallback) => void;
  /** 接口调用成功的回调函数 */
  type GetGroupInfoSuccessCallback = (res: GetGroupInfoCallback) => void;

  interface GetGroupInfoOption {
    /** 群信息hash值 */
    entryDataHash: string;
    /** 接口调用结束的回调函数(调用成功、失败都会执行) */
    complete?: GetGroupInfoCompleteCallback;
    /** 接口调用失败的回调函数 */
    fail?: GetGroupInfoFailCallback;
    /** 接口调用成功的回调函数 */
    success?: GetGroupInfoSuccessCallback;
  }

  interface GetGroupAppStatusCallback {
    /** 是否已经添加过群应用 */
    isExisted: boolean;
    errMsg: string;
  }

  /** 接口调用结束的回调函数(调用成功、失败都会执行) */
  type GetGroupAppStatusCompleteCallback = (
    res: GetGroupAppStatusCallback,
  ) => void;
  /** 接口调用失败的回调函数 */
  type GetGroupAppStatusFailCallback = (res: GetGroupAppStatusCallback) => void;
  /** 接口调用成功的回调函数 */
  type GetGroupAppStatusSuccessCallback = (
    res: GetGroupAppStatusCallback,
  ) => void;

  interface GetGroupAppStatusOption {
    /** 群信息hash值 */
    entryDataHash: string;
    /** 接口调用结束的回调函数(调用成功、失败都会执行) */
    complete?: GetGroupAppStatusCompleteCallback;
    /** 接口调用失败的回调函数 */
    fail?: GetGroupAppStatusFailCallback;
    /** 接口调用成功的回调函数 */
    success?: GetGroupAppStatusSuccessCallback;
  }

  interface Wx {
    /** 在手机桌面上添加该小程序的快捷启动图标。 */
    saveAppToDesktop(option?: SaveAppToDesktopOption): void;

    /** 获取群相关信息 */
    getGroupInfo(option?: GetGroupInfoOption): void;

    /** 获取当前小程序是否添加了群应用 */
    getGroupAppStatus(option?: GetGroupAppStatusOption): void;
  }
}

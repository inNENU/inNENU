import { compareVersion } from "../app/index.js";
import type { App } from "../app.js";
import { env, info } from "../state/index.js";

// 获取 SDK 版本
const { SDKVersion } = (wx.getAppBaseInfo || wx.getSystemInfoSync)();

/** 是否支持 redirect manual */
export const supportRedirect =
  env === "wx" &&
  ["android", "ios"].includes(info.platform) &&
  compareVersion(SDKVersion, "3.2.2") > 0;

/*@__NO_SIDE_EFFECTS__*/
export const createService =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends (...args: any) => any>(
    name: string,
    localService: T,
    onlineService: T,
  ): T =>
    ((...args: Parameters<T>): ReturnType<T> => {
      const { globalData } = getApp<App>();

      const shouldUseOnlineService =
        globalData.service[name] === "online" ||
        globalData.service.forceOnline ||
        false;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return (shouldUseOnlineService ? onlineService : localService)(...args);
    }) as T;

export const getIETimeStamp = (): number => {
  const time = new Date().getMilliseconds();

  return Math.floor(time / 100) * 100;
};

// 小程序会自动解析 302，所以我们需要检查 WebVPN 是否已失效
export const isWebVPNPage = (content: string): boolean =>
  content.includes("fuckvpn") || content.includes("东北师范大学 WebVPN");

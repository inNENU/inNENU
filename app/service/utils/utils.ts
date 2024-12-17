import { compareVersion } from "@mptool/all";

import type { App } from "../../app.js";
import { appInfo, env, platform } from "../../state/index.js";

/** 是否支持 redirect manual */
export const supportRedirect =
  env === "wx" &&
  ["android", "ios"].includes(platform) &&
  compareVersion(appInfo.SDKVersion, "3.2.2") > 0;

export const isOnlineService = (name: string): boolean => {
  const { globalData } = getApp<App>();

  return (
    globalData.service[name] === "online" ||
    globalData.service.forceOnline ||
    false
  );
};

/*@__NO_SIDE_EFFECTS__*/
export const createService =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  <T extends (...args: any) => any>(
    name: string,
    localService: T,
    onlineService: T,
  ): T =>
    ((...args: Parameters<T>): ReturnType<T> => {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return (isOnlineService(name) ? onlineService : localService)(...args);
    }) as T;

export const getIETimeStamp = (): number => {
  const time = new Date().getMilliseconds();

  return Math.floor(time / 100) * 100;
};

// 小程序会自动解析 302，所以我们需要检查 WebVPN 是否已失效
export const isWebVPNPage = (content: unknown): boolean =>
  typeof content === "string" &&
  (content.includes("fuckvpn") || content.includes("东北师范大学 WebVPN"));

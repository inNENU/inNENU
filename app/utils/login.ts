import type { AppID, Env } from "./typings.js";
import { request } from "../api/index.js";

interface LoginCallback {
  openid: string;
  isAdmin: boolean;
  inBlacklist: boolean;
}

/**
 * 登录
 *
 * @param appID 小程序的appID
 */
export const login = (
  appID: AppID,
  env: Env,
  callback: (result: LoginCallback) => void,
): void => {
  const openid = wx.getStorageSync<string | undefined>("openid");

  if (env === "qq" || env === "wx") {
    wx.login({
      success: async ({ code }) => {
        if (code) {
          const { data } = await request<LoginCallback>("/mp/login", {
            method: "POST",
            body: { appID, code, env, openid },
          });

          console.info(`User OPENID: ${data.openid}`);
          callback(data);
        }
      },
      fail: ({ errMsg }) => {
        console.error(`Login failed: ${errMsg}`);
      },
    });
  }
};

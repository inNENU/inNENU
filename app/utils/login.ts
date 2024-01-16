import { request } from "../api/index.js";
import { info } from "../state/info.js";

const { appID, env } = info;

export interface LoginInfo {
  openid: string;
  isAdmin: boolean;
  inBlacklist: boolean;
}

/**
 * 登录
 *
 * @param appID 小程序的appID
 */
export const login = (callback: (result: LoginInfo) => void): void => {
  const openid = wx.getStorageSync<string | undefined>("openid");

  if (env === "qq" || env === "wx") {
    wx.login({
      success: async ({ code }) => {
        if (code) {
          const { data } = await request<LoginInfo>("/mp/login", {
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

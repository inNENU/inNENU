import { logger } from "@mptool/all";

import { request } from "../../api/index.js";
import { appID, env, user } from "../../state/index.js";

export interface LoginInfo {
  openid: string | null;
  isAdmin: boolean;
  inBlacklist: boolean;
}

export const mpLogin = (): Promise<LoginInfo> => {
  if (user.openid)
    return request<LoginInfo>("/mp/login", {
      method: "POST",
      body: { openid: user.openid },
    }).then(({ data }) => data);

  if (env === "qq" || env === "wx") {
    new Promise((resolve, reject) => {
      wx.login({
        success: ({ code }) =>
          request<LoginInfo>("/mp/login", {
            method: "POST",
            body: { appID, code, env },
          }).then(({ data }) => resolve(data)),
        fail: ({ errMsg }) => {
          logger.error(`Login failed: ${errMsg}`);

          reject(new Error(errMsg));
        },
      });
    });
  }

  return Promise.resolve({
    openid: null,
    isAdmin: false,
    inBlacklist: false,
  });
};

import { logger } from "@mptool/all";

import { AUTH_SERVER } from "./utils.js";
import { request } from "../../api/net.js";
import type { AccountInfo } from "../../utils/typings.js";
import type { AuthLoginResponse } from "../typings.js";

export const authLogin = async ({
  id,
  password,
}: AccountInfo): Promise<AuthLoginResponse> => {
  const { data } = await request<AuthLoginResponse>("/auth/login", {
    method: "POST",
    body: { id, password },
    cookieScope: AUTH_SERVER,
  });

  if (!data.success)
    logger.error("登录失败", "captcha" in data ? "需要验证码" : data.msg);

  return data;
};

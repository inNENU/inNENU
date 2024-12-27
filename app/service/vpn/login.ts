import { VPN_DOMAIN, VPN_SERVER } from "./utils.js";
import { cookieStore, request } from "../../api/index.js";
import type { AccountInfo } from "../../state/index.js";
import type { AuthLoginFailedResponse } from "../auth/login.js";
import { authLogin } from "../auth/login.js";
import type { CommonFailedResponse } from "../utils/index.js";
import { ActionFailType, UnknownResponse } from "../utils/index.js";

const CAS_LOGIN_URL = `${VPN_SERVER}/users/auth/cas`;
const UPDATE_KEY_URL = `${VPN_SERVER}/vpn_key/update`;

export interface VPNLoginSuccessResponse {
  success: true;
}

export type VPNLoginFailedResponse = CommonFailedResponse<
  | ActionFailType.AccountLocked
  | ActionFailType.WrongPassword
  | ActionFailType.Unknown
>;

export type VPNLoginResponse =
  | VPNLoginSuccessResponse
  | VPNLoginFailedResponse
  | AuthLoginFailedResponse;

export const vpnCASLoginLocal = async ({
  id,
  password,
  authToken,
}: AccountInfo): Promise<VPNLoginResponse> => {
  // clear VPN cookies
  cookieStore.clear(VPN_DOMAIN);

  const { status } = await request<string>(CAS_LOGIN_URL, {
    redirect: "manual",
  });

  if (status === 302) {
    const authResult = await authLogin({
      id,
      password,
      authToken,
      service: `${CAS_LOGIN_URL}/callback?url=${encodeURIComponent(
        `${VPN_SERVER}/users/sign_in`,
      )}`,
    });

    if (!authResult.success) return authResult;

    const callbackResponse = await request(authResult.location, {
      redirect: "manual",
    });

    if (callbackResponse.status === 500)
      return {
        success: false,
        type: ActionFailType.Unknown,
        msg: "学校 WebVPN 服务崩溃，请稍后重试。",
      };

    const location = callbackResponse.headers.get("Location");

    if (callbackResponse.status === 302 && location === UPDATE_KEY_URL) {
      await request(UPDATE_KEY_URL);

      return {
        success: true,
      };
    }
  }

  if (status === 500)
    return {
      success: false,
      type: ActionFailType.Unknown,
      msg: "学校 WebVPN 服务崩溃，请稍后重试。",
    };

  return UnknownResponse("登录失败");
};

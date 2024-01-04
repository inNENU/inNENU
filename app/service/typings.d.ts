import type { AuthLoginFailedResponse } from "./auth/login.js";
import type { LoginFailType } from "./loginFailTypes.js";
import type { CommonFailedResponse } from "../../typings/response.js";

export interface VPNLoginSuccessResponse {
  success: true;
}

export interface VPNLoginFailedResponse extends CommonFailedResponse {
  type:
    | LoginFailType.AccountLocked
    | LoginFailType.WrongPassword
    | LoginFailType.Unknown;
}

export type VPNLoginResponse =
  | VPNLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

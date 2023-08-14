import type { LoginFailType } from "./loginFailTypes.ts";
import type { CommonFailedResponse } from "../../typings/response.js";

export interface AuthLoginSuccessResponse {
  success: true;
  location: string;
}

export interface AuthLoginFailedResponse extends CommonFailedResponse {
  type: Exclude<LoginFailType, LoginFailType.WrongCaptcha>;
}

export type AuthLoginResponse =
  | AuthLoginSuccessResponse
  | AuthLoginFailedResponse;

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

export interface ActionLoginSuccessResponse {
  success: true;
}

export type ActionLoginResponse =
  | ActionLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

export interface UnderSystemLoginSuccessResponse {
  success: true;
}

export type UnderSystemLoginResponse =
  | UnderSystemLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

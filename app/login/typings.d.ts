import type { LoginFailType } from "./loginFailTypes.ts";
import type { CommonFailedResponse } from "../../typings/response.js";

export interface AuthLoginSuccessResponse {
  success: true;
}

export interface AuthLoginFailedResponse extends CommonFailedResponse {
  type: LoginFailType;
}

export interface AuthLoginCaptchaResponse {
  success: false;
  type: LoginFailType.NeedCaptcha;
  captcha: string;
}

export type AuthLoginResponse =
  | AuthLoginSuccessResponse
  | AuthLoginCaptchaResponse
  | AuthLoginFailedResponse;

export interface VPNLoginSuccessResponse {
  success: true;
}

export interface VPNLoginFailedResponse extends CommonFailedResponse {
  type: "locked" | "wrong" | "unknown" | "expired";
}

export type VPNLoginResponse =
  | VPNLoginSuccessResponse
  | VPNLoginFailedResponse
  | AuthLoginFailedResponse;

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

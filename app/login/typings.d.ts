import type { CommonFailedResponse } from "../../typings/response.js";

export interface AuthLoginSuccessResponse {
  success: true;
  location: string;
}

export interface AuthLoginFailedResponse extends CommonFailedResponse {
  type: "captcha" | "wrong" | "unknown";
}

export type AuthLoginResponse =
  | AuthLoginSuccessResponse
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

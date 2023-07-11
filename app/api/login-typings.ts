import { type Cookie } from "../../typings/cookie.js";
import { type CommonFailedResponse } from "../../typings/response.js";

export interface AuthLoginSuccessResponse {
  success: true;
  cookies: Cookie[];
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
  cookies: Cookie[];
}

export interface VPNLoginFailedResponse extends CommonFailedResponse {
  type: "locked" | "wrong" | "unknown";
}

export type VPNLoginResponse =
  | VPNLoginSuccessResponse
  | VPNLoginFailedResponse
  | AuthLoginFailedResponse;

export interface ActionLoginSuccessResponse {
  success: true;

  cookies: Cookie[];
}

export type ActionLoginResponse =
  | ActionLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

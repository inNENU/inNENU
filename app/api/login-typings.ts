import { type Cookie } from "../../typings/cookie.js";
import { type CommonFailedResponse } from "../../typings/response.js";

export interface AuthLoginSuccessResponse {
  status: "success";
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
  status: "success";
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
  status: "success";

  cookies: Cookie[];
}

export type ActionLoginResponse =
  | ActionLoginSuccessResponse
  | AuthLoginFailedResponse
  | VPNLoginFailedResponse;

export interface CommonFailedResponse {
  status: "failed";
  msg: string;
}

export interface CookieVerifySuccessResponse {
  status: "success";
  valid: boolean;
}

export type CookieVerifyResponse =
  | CookieVerifySuccessResponse
  | CommonFailedResponse;

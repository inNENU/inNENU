export interface CommonFailedResponse {
  success: false;
  msg: string;
}

export interface CookieVerifySuccessResponse {
  success: true;
  valid: boolean;
}

export type CookieVerifyResponse =
  | CookieVerifySuccessResponse
  | CommonFailedResponse;

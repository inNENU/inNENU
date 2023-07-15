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
  // make valid key exists
  | (CommonFailedResponse & { valid?: undefined });

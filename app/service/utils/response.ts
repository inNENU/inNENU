export interface CommonSuccessResponse<T = Record<never, never>> {
  success: true;
  data: T;
}

export interface CommonListSuccessResponse<T = Record<never, never>> {
  success: true;
  data: T;
  current: number;
  total: number;
}

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

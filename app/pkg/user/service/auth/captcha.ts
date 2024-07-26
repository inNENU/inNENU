import { URLSearchParams } from "@mptool/all";

import { AUTH_CAPTCHA_URL } from "./utils.js";
import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
} from "../../../../service/index.js";
import {
  AUTH_COOKIE_SCOPE,
  AUTH_SERVER,
  createService,
} from "../../../../service/index.js";

interface RawAuthCaptchaResponse {
  smallImage: string;
  bigImage: string;
  tagWidth: number;
  yHeight: number;
}

export interface AuthCaptchaInfo {
  slider: string;
  bg: string;
  sliderWidth: number;
  offsetY: number;
}

export interface AuthCaptchaSuccessResponse {
  success: true;
  data: AuthCaptchaInfo;
}

export type AuthCaptchaResponse =
  | AuthCaptchaSuccessResponse
  | CommonFailedResponse<ActionFailType.Unknown>;

export const getAuthCaptchaLocal = async (
  id: string,
): Promise<AuthCaptchaResponse> => {
  const {
    data: { bigImage, smallImage, tagWidth, yHeight },
  } = await request<RawAuthCaptchaResponse>(
    `${AUTH_CAPTCHA_URL}?_=${Date.now()}`,
    {
      method: "POST",
      body: new URLSearchParams({
        userName: id,
        authCodeTypeName: "reAuthDynamicCodeType",
      }),
    },
  );

  return {
    success: true,
    data: {
      slider: `data:image/png;base64,${smallImage}`,
      bg: `data:image/png;base64,${bigImage}`,
      offsetY: yHeight,
      sliderWidth: tagWidth,
    },
  };
};

const getAuthCaptchaOnline = async (id: string): Promise<AuthCaptchaResponse> =>
  request<AuthCaptchaResponse>(`/auth/auth-captcha?id=${id}`, {
    cookieScope: AUTH_COOKIE_SCOPE,
  }).then(({ data }) => data);

export const getAuthCaptcha = createService(
  "auth-captcha",
  getAuthCaptchaLocal,
  getAuthCaptchaOnline,
);

const VERIFY_CAPTCHA_URL = `${AUTH_SERVER}/authserver/common/verifySliderCaptcha.htl`;

type RawVerifyAuthCaptchaResponse =
  | {
      errorCode: 1;
      errorMsg: "success";
    }
  | {
      errorCode: 0;
      errorMsg: "error";
    };

const verifyAuthCaptchaLocal = async (
  distance: number,
): Promise<{ success: boolean }> => {
  const { data } = await request<RawVerifyAuthCaptchaResponse>(
    VERIFY_CAPTCHA_URL,
    {
      method: "POST",
      body: new URLSearchParams({
        canvasLength: "295",
        moveLength: distance.toString(),
      }),
    },
  );

  return {
    success: data.errorMsg === "success",
  };
};

const verifyAuthCaptchaOnline = async (
  distance: number,
): Promise<{ success: boolean }> =>
  request<{ success: boolean }>(`/auth/auth-captcha`, {
    method: "POST",
    body: { width: "295", distance },
    cookieScope: AUTH_COOKIE_SCOPE,
  }).then(({ data }) => data);

export const verifyAuthCaptcha = createService(
  "auth-captcha",
  verifyAuthCaptchaLocal,
  verifyAuthCaptchaOnline,
);

import { URLSearchParams, decodeBase64 } from "@mptool/all";

import { AUTH_CAPTCHA_URL } from "./utils.js";
import { request } from "../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import {
  AUTH_COOKIE_SCOPE,
  AUTH_SERVER,
  authEncrypt,
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
  safeValue: string;
}

export interface AuthCaptchaSuccessResponse {
  success: true;
  data: AuthCaptchaInfo;
}

export type AuthCaptchaResponse =
  | AuthCaptchaSuccessResponse
  | CommonFailedResponse;

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

  // Extract safeValue from smallImage
  let safeValue = "";

  try {
    // Use @mptool/all decodeBase64 method
    const arrayBuffer = decodeBase64(smallImage);
    const uint8Array = new Uint8Array(arrayBuffer);
    const dataLength = uint8Array.length;

    // Extract last 16 bytes as safeValue
    for (let i = dataLength - 16; i < dataLength; i++) {
      safeValue += String.fromCharCode(uint8Array[i]);
    }
  } catch (error) {
    console.error("Failed to extract safeValue:", error);
    safeValue = "";
  }

  return {
    success: true,
    data: {
      slider: `data:image/png;base64,${smallImage}`,
      bg: `data:image/png;base64,${bigImage}`,
      offsetY: yHeight,
      sliderWidth: tagWidth,
      safeValue,
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

export const CAPTCHA_CANVAS_WIDTH = 295;
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

/**
 * 滑块轨迹点接口
 */
export interface SliderTrackPoint {
  /** 滑块的水平位置（距离） */
  a: number;
  /** 滑块的垂直偏移量 */
  b: number;
  /** 时间差（毫秒） */
  c: number;
}

const verifyAuthCaptchaLocal = async (
  moveLength: number,
  tracks: SliderTrackPoint[],
  safeValue: string,
): Promise<{ success: boolean }> => {
  // Prepare the verification data
  const { data } = await request<RawVerifyAuthCaptchaResponse>(
    VERIFY_CAPTCHA_URL,
    {
      method: "POST",
      body: new URLSearchParams({
        sign: authEncrypt(
          JSON.stringify({
            canvasLength: CAPTCHA_CANVAS_WIDTH,
            moveLength,
            tracks,
          }),
          safeValue,
        ),
      }),
    },
  );

  return {
    success: data.errorMsg === "success",
  };
};

const verifyAuthCaptchaOnline = async (
  moveLength: number,
  tracks: SliderTrackPoint[],
  safeValue: string,
): Promise<{ success: boolean }> =>
  request<{ success: boolean }>(`/auth/auth-captcha`, {
    method: "POST",
    body: { canvasLength: CAPTCHA_CANVAS_WIDTH, moveLength, tracks, safeValue },
    cookieScope: AUTH_COOKIE_SCOPE,
  }).then(({ data }) => data);

export const verifyAuthCaptcha = createService(
  "auth-captcha",
  verifyAuthCaptchaLocal,
  verifyAuthCaptchaOnline,
);

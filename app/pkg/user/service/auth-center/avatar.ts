import { withAuthCenterLogin } from "./login.js";
import { CENTER_PREFIX } from "./utils.js";
import { request } from "../../../../api/index.js";
import type {
  ActionFailType,
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  ExpiredResponse,
  UnknownResponse,
  createService,
} from "../../../../service/index.js";

const USER_CONF_URL = `${CENTER_PREFIX}/common/getUserConf`;

interface RawUserConfData {
  code: "0";
  message: "SUCCESS";
  datas: {
    uid: string;
    nickName: string;
    cn: string;
    headImageIcon: string;
    logoutUrl: string;
    theme: string;
    languageEnabled: boolean;
    personalDisplay: boolean;
    schoolLogEnabled: boolean;
  };
}

export type AvatarResponse =
  | CommonSuccessResponse<{ avatar: string }>
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Unknown>;

export const getAvatarLocal = async (): Promise<AvatarResponse> => {
  try {
    const { data } = await request<RawUserConfData>(USER_CONF_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: "{}",
      redirect: "manual",
    });

    if (typeof data === "string") return ExpiredResponse;

    return {
      success: true,
      data: {
        avatar: `data:image/png;base64,${data.datas.headImageIcon}`,
      },
    };
  } catch (err) {
    console.error(err);

    return UnknownResponse((err as Error).message);
  }
};

export const getAvatarOnline = async (): Promise<AvatarResponse> =>
  request<AvatarResponse>("/auth-center/check", {
    method: "POST",
    cookieScope: CENTER_PREFIX,
  }).then(({ data }) => data);

export const getAvatar = withAuthCenterLogin(
  createService("avatar", getAvatarLocal, getAvatarOnline),
);

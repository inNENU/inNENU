import { logger } from "@mptool/all";

import { handleFailResponse } from "./account.js";
import type {
  AuthLoginFailedResponse,
  MyLoginResponse,
  VPNLoginFailedResponse,
} from "./typings.js";
import type {
  CommonFailedResponse,
  CookieVerifyResponse,
} from "../../typings/response.js";
import { request } from "../api/net.js";
import { service } from "../config/info.js";
import { cookieStore } from "../utils/cookie.js";
import type { AccountInfo, UserInfo } from "../utils/typings.js";

export const MY_SERVER = "https://my.webvpn.nenu.edu.cn";
export const MY_MAIN_PAGE = `${MY_SERVER}/portal_main/toPortalPage`;

export const myLogin = async (
  options: AccountInfo,
): Promise<MyLoginResponse> => {
  const data = await request<MyLoginResponse>(`${service}my/login`, {
    method: "POST",
    data: options,
    scope: MY_SERVER,
  });

  if (!data.success) {
    logger.error("登录失败", data.msg);
    handleFailResponse(data);
  }

  return data;
};

export const checkMyCookie = (): Promise<CookieVerifyResponse> =>
  request<CookieVerifyResponse>(`${service}my/check`, {
    method: "POST",
    scope: MY_SERVER,
  });

export const ensureMyLogin = async (
  account: AccountInfo,
  check = false,
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  const cookies = cookieStore.getCookies(MY_SERVER);

  if (cookies.length) {
    if (!check) return null;

    const { valid } = await checkMyCookie();

    if (valid) return null;
  }

  const result = await myLogin(account);

  return result.success ? null : result;
};

interface RawInfo {
  success: true;
  data: {
    execResponse: {
      return: {
        Body: {
          code: "200";
          flag: "1";
          msg: "sueccess";
          rows: "1";
          total: "1";
          items: {
            item: [
              {
                uid: string;
                name: string;
                idcard: string;
                orgdn: string;
                mzdm: string;
                mzmc: string;
                xbdm: string;
                xbmc: string;
                csrq: string;
                orgname: string;
                zydm: string;
                zymc: string;
                rxnf: string;
                xznj: string;
                lb: string;
                zzmm: string;
                wf_dhhm: string;
                dhhm: string;
                wf_wx: string;
                wf_qq: string;
                wf_email: string;
                status: string;
                pycc: string;
                ryfldm: string;
              },
            ];
          };
        };
      };
    };
  };
}

export interface MyInfoSuccessResult {
  success: true;
  data: UserInfo;
}

export type MyInfoResult = MyInfoSuccessResult | CommonFailedResponse;

export const getMyInfo = async (): Promise<MyInfoResult> => {
  try {
    const infoResult = await request<RawInfo>(
      `${MY_SERVER}/sysform/loadIntelligent`,
      {
        method: "POST",
        header: {
          Accept: "application/json, text/javascript, */*; q=0.01",
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        data: "serviceAddress=dataCenter2.0%2Fsoap%2F00001_00036_01_02_20170918192121",
        scope: MY_SERVER,
      },
    );

    if (
      typeof infoResult === "object" &&
      infoResult.success &&
      infoResult.data.execResponse.return.Body.code === "200"
    ) {
      const info = infoResult.data.execResponse.return.Body.items.item[0];

      return {
        success: true,
        data: {
          id: Number(info.uid),
          name: info.name,
          idCard: info.idcard,
          org: info.orgname,
          orgId: Number(info.orgdn),
          major: info.zymc,
          majorId: info.zydm,
          inYear: Number(info.rxnf),
          grade: Number(info.xznj),
          type: info.pycc,
          typeId: info.lb,
          code: info.ryfldm,
          politicalStatus: info.zzmm,
          people: info.mzmc,
          peopleId: Number(info.mzdm),
          gender: info.xbmc,
          genderId: Number(info.xbdm),
          birth: info.csrq,
        },
      };
    }

    return {
      success: false,
      msg: "获取人员信息失败",
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      msg: `获取人员信息失败: ${(<Error>err).message}`,
    };
  }
};

interface RawProcessResult {
  success: boolean;
  needShow: boolean;
  TASK_ID_: string;
  processDefinitionId: string;
  processDefinitionKey: string;
  PROC_INST_ID_: string;
  realFormPath: string;
  formPath: string;
}

export interface MyProcessSuccessResult {
  success: true;
  taskId: string;
  processId: string;
  processKey: string;
  instanceId: string;
  formPath: string;
  realFormPath: string;
}

export type MyProcessResult =
  | MyProcessSuccessResult
  | AuthLoginFailedResponse
  | CommonFailedResponse;

export const getProcess = async (
  processId: string,
): Promise<MyProcessResult> => {
  try {
    const processURL = `${MY_SERVER}/wf/process/startProcessByKey/${processId}?random=${Math.random()}`;

    const content = await request<RawProcessResult>(processURL, {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        Referer: MY_MAIN_PAGE,
      },
      data: "isFormPathDetail=false",
      scope: processURL,
    });

    return {
      success: true,
      taskId: content.TASK_ID_,
      instanceId: content.PROC_INST_ID_,
      formPath: content.formPath,
      realFormPath: content.realFormPath,
      processId: content.processDefinitionId,
      processKey: content.processDefinitionKey,
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      msg: `获取流程信息失败: ${(<Error>err).message}`,
    };
  }
};

import { logger, query } from "@mptool/all";

import { handleFailResponse } from "./fail.js";
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
  status: "check" | "validate" | "login" = "check",
): Promise<AuthLoginFailedResponse | VPNLoginFailedResponse | null> => {
  if (status !== "login") {
    const cookies = cookieStore.getCookies(MY_SERVER);

    if (cookies.length) {
      if (status === "check") return null;

      const { valid } = await checkMyCookie();

      if (valid) return null;
    }
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
                lb: "bks" | "yjs" | "lxs" | "jzg";
                zzmm: string;
                // eslint-disable-next-line @typescript-eslint/naming-convention
                wf_dhhm: string;
                dhhm: string;
                // eslint-disable-next-line @typescript-eslint/naming-convention
                wf_wx: string;
                // eslint-disable-next-line @typescript-eslint/naming-convention
                wf_qq: string;
                // eslint-disable-next-line @typescript-eslint/naming-convention
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

interface RawCompleteActionData {
  pageIndex: number;
  pageSize: number;
  totalCount: number;
  totalPage: number;
  data: {
    appId: string;
    applyPerson: string;
    applyPersonName: string;
    appName: string;
    appRedirectUrl: string;
    approveResult: string;
    currentNode: string;
    flowId: string;
    flowName: string;
    keyWord: string;
    lastApproveTime: string;
    pcRedirectUrl: string;
    serviceId: string;
    serviceName: string;
    serviceType: string;
    startTime: string;
    status: string;
  }[];
}

export interface CompleteActionResult {
  appId: string;
  flowId: string;
  flowName: string;
  serviceId: string;
  serviceName: string;
  apply: string;
  approve: string;
}

export interface MyCompleteActionsSuccessResult {
  success: true;
  data: CompleteActionResult[];
}

export const queryCompleteActions = async (): Promise<
  MyCompleteActionsSuccessResult | CommonFailedResponse
> => {
  const completeActionsResult = await request<RawCompleteActionData>(
    `${MY_SERVER}/taskCenter/queryMyApplicationComplete`,
    {
      method: "POST",
      header: {
        Accept: "application/json, text/javascript, */*; q=0.01",
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: query.stringify({
        _search: "false",
        nd: Date.now().toString(),
        limit: "100",
        page: "1",
        sidx: "",
        sord: "asc",
      }),
    },
  );

  if (typeof completeActionsResult === "object" && completeActionsResult.data)
    return {
      success: true,
      data: completeActionsResult.data.map(
        ({
          appId,
          flowName,
          flowId,
          serviceId,
          serviceName,
          startTime,
          lastApproveTime,
        }) => ({
          appId,
          flowId,
          flowName,
          serviceId,
          serviceName,
          apply: startTime,
          approve: lastApproveTime,
        }),
      ),
    };

  return {
    success: false,
    msg: "获取已办事项失败",
  };
};

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
      const personInfo = infoResult.data.execResponse.return.Body.items.item[0];

      const info = {
        id: Number(personInfo.uid),
        name: personInfo.name,
        idCard: personInfo.idcard,
        org: personInfo.orgname,
        school: personInfo.orgname,
        orgId: Number(personInfo.orgdn),
        major: personInfo.zymc,
        majorId: personInfo.zydm,
        inYear: Number(personInfo.rxnf),
        grade: Number(personInfo.xznj),
        type: personInfo.pycc,
        typeId: personInfo.lb,
        code: personInfo.ryfldm,
        politicalStatus: personInfo.zzmm,
        people: personInfo.mzmc,
        peopleId: Number(personInfo.mzdm),
        gender: personInfo.xbmc,
        genderId: Number(personInfo.xbdm),
        birth: personInfo.csrq,
      };

      // fix post birth
      if (/[A-Z]/.test(personInfo.csrq)) {
        const [day, month, year] = personInfo.csrq.split("-");

        const monthMap: Record<string, string> = {
          JAN: "01",
          FEB: "02",
          MAR: "03",
          APR: "04",
          MAY: "05",
          JUN: "06",
          JUL: "07",
          AUG: "08",
          SEP: "09",
          OCT: "10",
          NOV: "11",
          DEC: "12",
        };

        info.birth = `${
          year.startsWith("0") || year.startsWith("1") ? "20" : "19"
        }-${monthMap[month]}-${day}`;
      }

      const location = [
        // 本部外国语专业
        "167111",
        "167110",
        "1066",
        "050201",
        "055102",
      ].includes(info.majorId)
        ? "benbu"
        : [
              // 净月外国语专业
              "167120",
              "167180",
              "167130",
              "167140",
            ].includes(info.majorId)
          ? "jingyue"
          : ["070201"].includes(info.majorId) || info.major === "细胞生物学"
            ? "unknown"
            : [
                  253000, 170000, 166000, 234000, 173000, 236000, 232000,
                  174000, 175000, 177000,
                ].includes(info.orgId)
              ? "benbu"
              : [
                    161000, 169000, 252000, 168000, 261000, 178000, 235000,
                  ].includes(info.orgId)
                ? "jingyue"
                : "unknown";

      return {
        success: true,
        data: {
          ...info,
          location,
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

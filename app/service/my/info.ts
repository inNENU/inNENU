import { URLSearchParams } from "@mptool/all";

import { MY_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import type { UserInfo } from "../../state/index.js";
import { LoginFailType } from "../loginFailTypes.js";
import { isWebVPNPage } from "../utils.js";

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

export interface MyInfoSuccessResponse {
  success: true;
  data: UserInfo;
}

export type MyInfoResponse =
  | MyInfoSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export const getMyInfo = async (): Promise<MyInfoResponse> => {
  try {
    const { data: infoResult, status } = await request<RawInfo>(
      `${MY_SERVER}/sysform/loadIntelligent`,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
        body: new URLSearchParams({
          serviceAddress: "dataCenter2.0/soap/00001_00036_01_02_20170918192121",
        }),
        redirect: "manual",
      },
    );

    if (
      status === 302 ||
      (typeof infoResult === "string" && isWebVPNPage(infoResult))
    )
      return {
        success: false,
        msg: "请重新登录",
        type: LoginFailType.Expired,
      };

    if (
      infoResult.success &&
      infoResult.data.execResponse.return.Body?.code === "200"
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
      msg: "获取人员信息失败",
    };
  }
};

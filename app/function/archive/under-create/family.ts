import { logger, query } from "@mptool/all";

import { UnderArchiveFieldInfo, UnderFamilyOptions } from "./typings.js";
import { onlineUnderStudentArchive } from "./utils.js";
import { CommonFailedResponse } from "../../../../typings/index.js";
import { request } from "../../../api/index.js";
import {
  LoginFailType,
  UNDER_SYSTEM_SERVER,
  isWebVPNPage,
} from "../../../login/index.js";
import { cookieStore } from "../../../utils/cookie.js";

export interface UnderCreateStudentArchiveSubmitFamilyOptions {
  fields: UnderArchiveFieldInfo[];
  path: string;
  family: UnderFamilyOptions[];
}

export interface UnderCreateStudentArchiveSubmitFamilySuccessResponse {
  success: true;
}

export type UnderCreateStudentArchiveSubmitFamilyResponse =
  | UnderCreateStudentArchiveSubmitFamilySuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export const submitUnderStudentArchiveFamily = async ({
  path,
  fields,
  family,
}: UnderCreateStudentArchiveSubmitFamilyOptions): Promise<UnderCreateStudentArchiveSubmitFamilyResponse> => {
  try {
    if (family.length === 0) throw new Error("至少有1条家庭成员记录");
    if (family.length > 15) throw new Error("最多只能添加15条家庭成员记录");

    const params: Record<string, string> = Object.fromEntries(
      fields.map(({ name, value }) => [name, value]),
    );

    family.forEach(({ name, relation, office, title, phone }, index) => {
      if (name === "")
        throw new Error(`第${index + 1}条家庭成员记录姓名缺失。`);
      if (relation === "")
        throw new Error(`第${index + 1}条家庭成员记录与本人关系缺失。`);
      if (office === "")
        throw new Error(`第${index + 1}条家庭成员记录工作地点缺失。`);

      params[`gxm${index + 1}`] = relation;
      params[`cyxm${index + 1}`] = name;
      params[`gzdw${index + 1}`] = office;
      params[`cym${index + 1}`] = title;
      params[`gzdwxq${index + 1}`] = phone;
    });

    params.jls = `,${family.map((_, index) => index + 1).join(",")}`;

    const content = await request<string>(`${UNDER_SYSTEM_SERVER}${path}`, {
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: query.stringify(params),
    });

    if (isWebVPNPage(content)) {
      cookieStore.clear();

      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录已过期，请重新登录",
      };
    }

    if (content.includes("你已完成报到工作。"))
      return {
        success: true,
      };

    return {
      success: false,
      msg: "未知错误",
    };
  } catch (err) {
    logger.error(err);

    return {
      success: false,
      msg: (<Error>err).message,
    };
  }
};

export const submitOnlineUnderStudentArchiveFamily = (
  options: UnderCreateStudentArchiveSubmitFamilyOptions,
): Promise<UnderCreateStudentArchiveSubmitFamilyResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitFamilyOptions,
    UnderCreateStudentArchiveSubmitFamilyResponse
  >(options, { type: "submit-info" });

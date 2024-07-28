import { URLSearchParams, logger } from "@mptool/all";

import type { UnderArchiveFieldInfo, UnderFamilyOptions } from "./typings.js";
import { onlineUnderStudentArchive } from "./utils.js";
import { cookieStore, request } from "../../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../../service/index.js";
import {
  ActionFailType,
  createService,
  isWebVPNPage,
} from "../../../../../service/index.js";
import { UNDER_SYSTEM_SERVER } from "../utils.js";

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
  | CommonFailedResponse<ActionFailType.Expired>;

const submitUnderStudentArchiveFamilyLocal = async ({
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

    const { data: content } = await request<string>(
      `${UNDER_SYSTEM_SERVER}${path}`,
      {
        method: "POST",
        headers: {
          // TODO
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      },
    );

    if (isWebVPNPage(content)) {
      cookieStore.clear();

      return {
        success: false,
        type: ActionFailType.Expired,
        msg: "登录已过期，请重新登录",
      };
    }

    if (content.includes("您已完成报到工作。"))
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
      msg: (err as Error).message,
    };
  }
};

const submitUnderStudentArchiveFamilyOnline = (
  options: UnderCreateStudentArchiveSubmitFamilyOptions,
): Promise<UnderCreateStudentArchiveSubmitFamilyResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitFamilyOptions,
    UnderCreateStudentArchiveSubmitFamilyResponse
  >(options, { type: "submit-info" });

export const submitUnderStudentArchiveFamily = createService(
  "create-under-under-archive",
  submitUnderStudentArchiveFamilyLocal,
  submitUnderStudentArchiveFamilyOnline,
);

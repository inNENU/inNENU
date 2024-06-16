import { URLSearchParams, logger } from "@mptool/all";

import type {
  UnderArchiveFieldInfo,
  UnderFamilyOptions,
  UnderStudyOptions,
} from "./typings.js";
import {
  familyDataRegExp,
  hiddenFieldsRegExp,
  onlineUnderStudentArchive,
  pathRegExp,
} from "./utils.js";
import { cookieStore, request } from "../../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../../service/index.js";
import {
  LoginFailType,
  createService,
  isWebVPNPage,
} from "../../../../../service/index.js";
import { UNDER_SYSTEM_SERVER } from "../utils.js";

export interface UnderCreateStudentArchiveSubmitStudyOptions {
  fields: UnderArchiveFieldInfo[];
  path: string;
  study: UnderStudyOptions[];
}

export interface UnderCreateStudentArchiveSubmitStudySuccessResponse {
  success: true;
  family: UnderFamilyOptions[];
  fields: UnderArchiveFieldInfo[];
  path: string;
}

export type UnderCreateStudentArchiveSubmitStudyResponse =
  | UnderCreateStudentArchiveSubmitStudySuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

const submitUnderStudentArchiveStudyLocal = async ({
  path,
  fields,
  study,
}: UnderCreateStudentArchiveSubmitStudyOptions): Promise<UnderCreateStudentArchiveSubmitStudyResponse> => {
  try {
    if (study.length === 0) throw new Error("至少有1条学习与工作经历记录");
    if (study.length > 15)
      throw new Error("最多只能添加15条学习与工作经历记录");
    const params: Record<string, string> = Object.fromEntries(
      fields.map(({ name, value }) => [name, value]),
    );

    study.forEach(({ startTime, endTime, school, title, witness }, index) => {
      if (startTime === "" || endTime === "" || school === "" || witness === "")
        throw new Error(
          `第${
            index + 1
          }条学习与工作经历信息不完整。所有项目均为必填项，没有职务请填无。`,
        );

      if (!/^\d{8}$/.test(startTime) || !/^\d{8}$/.test(endTime))
        throw new Error(
          `第${index + 1}条学习与工作经历时间格式不正确，格式应为 20010101`,
        );

      params[`qsrq${index + 1}`] = startTime;
      params[`zzrq${index + 1}`] = endTime;
      params[`szdw${index + 1}`] = school;
      params[`gznr${index + 1}`] = title;
      params[`zmr${index + 1}`] = witness;
    });

    params.jls = `,${study.map((_, index) => index + 1).join(",")}`;

    const { data: content } = await request<string>(
      `${UNDER_SYSTEM_SERVER}${path}`,
      {
        method: "POST",
        // TODO: Check header
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams(params),
      },
    );

    if (isWebVPNPage(content)) {
      cookieStore.clear();

      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录已过期，请重新登录",
      };
    }

    const existingData = familyDataRegExp.exec(content)?.[1];

    const family = existingData
      ? (
          JSON.parse(existingData) as {
            gxm: string;
            cyxm: string;
            gzdw: string;
            cym: string;
            gzdwxq: string;
          }[]
        ).map(({ gxm, cyxm, gzdw, cym, gzdwxq }) => ({
          relation: gxm,
          name: cyxm,
          office: gzdw,
          title: cym,
          phone: gzdwxq,
        }))
      : [];

    if (!family.length)
      family.push({
        relation: "",
        name: "",
        office: "",
        title: "",
        phone: "",
      });

    const newFields = Array.from(content.matchAll(hiddenFieldsRegExp))
      .map(([, name, value]) => ({ name, value }))
      .filter((item) => item.name !== "jls");

    return {
      success: true,
      family,
      fields: newFields,
      path: pathRegExp.exec(content)![1],
    };
  } catch (err) {
    logger.error(err);

    return {
      success: false,
      msg: (err as Error).message,
    };
  }
};

const submitUnderStudentArchiveStudyOnline = (
  options: UnderCreateStudentArchiveSubmitStudyOptions,
): Promise<UnderCreateStudentArchiveSubmitStudyResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitStudyOptions,
    UnderCreateStudentArchiveSubmitStudyResponse
  >(options, { type: "submit-info" });

export const submitUnderStudentArchiveStudy = createService(
  "create-under-archive",
  submitUnderStudentArchiveStudyLocal,
  submitUnderStudentArchiveStudyOnline,
);

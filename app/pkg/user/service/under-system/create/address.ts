import { URLSearchParams, logger } from "@mptool/all";

import type { UnderArchiveFieldInfo, UnderStudyOptions } from "./typings.js";
import {
  hiddenFieldsRegExp,
  onlineUnderStudentArchive,
  pathRegExp,
  studyDataRegExp,
} from "./utils.js";
import { cookieStore, request } from "../../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../../service/index.js";
import {
  LoginFailType,
  createService,
  isWebVPNPage,
} from "../../../../../service/index.js";
import { UNDER_SYSTEM_SERVER } from "../utils.js";

export interface UnderCreateStudentArchiveSubmitAddressOptions {
  fields: UnderArchiveFieldInfo[];
  path: string;
}

export interface UnderCreateStudentArchiveSubmitAddressSuccessResponse {
  success: true;
  study: UnderStudyOptions[];
  fields: UnderArchiveFieldInfo[];
  path: string;
}

export type UnderCreateStudentArchiveSubmitAddressResponse =
  | UnderCreateStudentArchiveSubmitAddressSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

const submitUnderStudentArchiveAddressLocal = async ({
  path,
  fields,
}: UnderCreateStudentArchiveSubmitAddressOptions): Promise<UnderCreateStudentArchiveSubmitAddressResponse> => {
  try {
    const { data: content } = await request<string>(
      `${UNDER_SYSTEM_SERVER}${path}`,
      {
        method: "POST",
        body: new URLSearchParams(
          fields.map<[string, string]>(({ name, value }) => [name, value]),
        ),
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

    const existingData = studyDataRegExp.exec(content)?.[1];

    const study = existingData
      ? (
          JSON.parse(existingData) as {
            qsrq: string;
            zzrq: string;
            szdw: string;
            gznr: string;
            zmr: string;
          }[]
        ).map(({ qsrq, zzrq, szdw, gznr, zmr }) => ({
          startTime: qsrq,
          endTime: zzrq,
          school: szdw,
          title: gznr,
          witness: zmr,
        }))
      : [];

    if (!study.length)
      study.push({
        startTime: "",
        endTime: "",
        school: "",
        title: "",
        witness: "",
      });

    const newFields = Array.from(content.matchAll(hiddenFieldsRegExp))
      .map(([, name, value]) => ({ name, value }))
      .filter((item) => item.name !== "jls");

    return {
      success: true,
      study,
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

const submitUnderStudentArchiveAddressOnline = (
  options: UnderCreateStudentArchiveSubmitAddressOptions,
): Promise<UnderCreateStudentArchiveSubmitAddressResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitAddressOptions,
    UnderCreateStudentArchiveSubmitAddressResponse
  >(options, { type: "submit-address" });

export const submitUnderStudentArchiveAddress = createService(
  "create-under-under-archive",
  submitUnderStudentArchiveAddressLocal,
  submitUnderStudentArchiveAddressOnline,
);

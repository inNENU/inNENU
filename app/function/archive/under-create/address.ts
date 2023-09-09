import { logger, query } from "@mptool/all";

import { UnderArchiveFieldInfo, UnderStudyOptions } from "./typings.js";
import {
  hiddenFieldsRegExp,
  onlineUnderStudentArchive,
  pathRegExp,
  studyDataRegExp,
} from "./utils.js";
import { CommonFailedResponse } from "../../../../typings/index.js";
import { request } from "../../../api/index.js";
import {
  LoginFailType,
  UNDER_SYSTEM_SERVER,
  isWebVPNPage,
} from "../../../login/index.js";
import { cookieStore } from "../../../utils/cookie.js";

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

export const submitUnderStudentArchiveAddress = async ({
  path,
  fields,
}: UnderCreateStudentArchiveSubmitAddressOptions): Promise<UnderCreateStudentArchiveSubmitAddressResponse> => {
  try {
    const content = await request<string>(`${UNDER_SYSTEM_SERVER}${path}`, {
      method: "POST",
      header: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: query.stringify(
        Object.fromEntries(fields.map(({ name, value }) => [name, value])),
      ),
    });

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
      ? (<
          {
            qsrq: string;
            zzrq: string;
            szdw: string;
            gznr: string;
            zmr: string;
          }[]
        >JSON.parse(existingData)).map(({ qsrq, zzrq, szdw, gznr, zmr }) => ({
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
      msg: (<Error>err).message,
    };
  }
};

export const submitOnlineUnderStudentArchiveAddress = (
  options: UnderCreateStudentArchiveSubmitAddressOptions,
): Promise<UnderCreateStudentArchiveSubmitAddressResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitAddressOptions,
    UnderCreateStudentArchiveSubmitAddressResponse
  >(options, { type: "submit-address" });

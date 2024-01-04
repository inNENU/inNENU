import { URLSearchParams, logger } from "@mptool/all";

import { UnderArchiveFieldInfo, UnderStudyOptions } from "./typings.js";
import {
  hiddenFieldsRegExp,
  onlineUnderStudentArchive,
  pathRegExp,
  studyDataRegExp,
} from "./utils.js";
import { CommonFailedResponse } from "../../../../typings/index.js";
import { cookieStore, request } from "../../../api/index.js";
import { LoginFailType } from "../../loginFailTypes.js";
import { isWebVPNPage } from "../../utils.js";
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

export const submitUnderStudentArchiveAddress = async ({
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

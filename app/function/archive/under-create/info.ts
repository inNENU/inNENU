import { logger, query } from "@mptool/all";

import { InputUnderArchiveInfo, UnderArchiveFieldInfo } from "./typings.js";
import {
  fieldsRegExp,
  hiddenFieldsRegExp,
  info2RowRegExp,
  onlineUnderStudentArchive,
  pathRegExp,
  requiredRegExp,
} from "./utils.js";
import { CommonFailedResponse } from "../../../../typings/index.js";
import { request } from "../../../api/index.js";
import {
  LoginFailType,
  UNDER_SYSTEM_SERVER,
  isWebVPNPage,
} from "../../../login/index.js";
import { cookieStore } from "../../../utils/cookie.js";

export interface UnderCreateStudentArchiveSubmitInfoOptions {
  fields: UnderArchiveFieldInfo[];
  path: string;
}

export interface UnderCreateStudentArchiveSubmitInfoSuccessResponse {
  success: true;
  inputs: InputUnderArchiveInfo[];
  fields: UnderArchiveFieldInfo[];
  path: string;
}

export type UnderCreateStudentArchiveSubmitInfoResponse =
  | UnderCreateStudentArchiveSubmitInfoSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

export const submitUnderStudentArchiveInfo = async ({
  path,
  fields,
}: UnderCreateStudentArchiveSubmitInfoOptions): Promise<UnderCreateStudentArchiveSubmitInfoResponse> => {
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

    const inputs = Array.from(content.matchAll(info2RowRegExp))
      .map(([, ...matches]) =>
        matches.map((item) => item.replace(/&nbsp;/g, " ").trim()),
      )
      .map(([text, input, remark]) => {
        const [, name, value] = Array.from(input.matchAll(fieldsRegExp)!)[0];
        const required = requiredRegExp.test(input);

        return {
          text,
          name,
          value,
          remark,
          required,
        };
      });

    const hiddenFields = Array.from(content.matchAll(hiddenFieldsRegExp)).map(
      ([, name, value]) => ({ name, value }),
    );

    return {
      success: true,
      inputs,
      fields: hiddenFields,
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

export const submitOnlineUnderStudentArchiveInfo = (
  options: UnderCreateStudentArchiveSubmitInfoOptions,
): Promise<UnderCreateStudentArchiveSubmitInfoResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitInfoOptions,
    UnderCreateStudentArchiveSubmitInfoResponse
  >(options, { type: "submit-info" });

import { URLSearchParams, logger } from "@mptool/all";

import type {
  InputUnderArchiveInfo,
  UnderArchiveFieldInfo,
} from "./typings.js";
import {
  fieldsRegExp,
  hiddenFieldsRegExp,
  info2RowRegExp,
  onlineUnderStudentArchive,
  pathRegExp,
  requiredRegExp,
} from "./utils.js";
import type { CommonFailedResponse } from "../../../../typings/index.js";
import { cookieStore, request } from "../../../api/index.js";
import { LoginFailType } from "../../loginFailTypes.js";
import { createService, isWebVPNPage } from "../../utils.js";
import { UNDER_SYSTEM_SERVER } from "../utils.js";

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

const submitUnderStudentArchiveInfoLocal = async ({
  path,
  fields,
}: UnderCreateStudentArchiveSubmitInfoOptions): Promise<UnderCreateStudentArchiveSubmitInfoResponse> => {
  try {
    const { data: content } = await request<string>(
      `${UNDER_SYSTEM_SERVER}${path}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
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

    const inputs = Array.from(content.matchAll(info2RowRegExp))
      .map(([, ...matches]) =>
        matches.map((item) => item.replace(/&nbsp;/g, " ").trim()),
      )
      .map(([text, input, remark]) => {
        const [, name, value] = Array.from(input.matchAll(fieldsRegExp))[0];
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
      msg: (err as Error).message,
    };
  }
};

const submitUnderStudentArchiveInfoOnline = (
  options: UnderCreateStudentArchiveSubmitInfoOptions,
): Promise<UnderCreateStudentArchiveSubmitInfoResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitInfoOptions,
    UnderCreateStudentArchiveSubmitInfoResponse
  >(options, { type: "submit-info" });

export const submitUnderStudentArchiveInfo = createService(
  "create-archive",
  submitUnderStudentArchiveInfoLocal,
  submitUnderStudentArchiveInfoOnline,
);

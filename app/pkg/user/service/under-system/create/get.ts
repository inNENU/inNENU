import { logger } from "@mptool/all";

import type {
  MultiSelectUnderArchiveInfo,
  ReadonlyUnderArchiveInfo,
  SingleSelectUnderArchiveInfo,
  UnderArchiveFieldInfo,
} from "./typings.js";
import {
  checkBoxRegExp,
  hiddenFieldsRegExp,
  infoRowRegExp,
  inputRegExp,
  nextLinkRegExp,
  onlineUnderStudentArchive,
  optionRegExp,
  pathRegExp,
  readonlyRegExp,
  selectRegExp,
} from "./utils.js";
import { cookieStore, request } from "../../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../../service/index.js";
import {
  ActionFailType,
  ExpiredResponse,
  createService,
  getIETimeStamp,
  isWebVPNPage,
} from "../../../../../service/index.js";
import { UNDER_SYSTEM_SERVER } from "../utils.js";

export interface UnderCreateStudentArchiveGetInfoSuccessResponse {
  success: true;
  readonly: ReadonlyUnderArchiveInfo[];
  editable: (SingleSelectUnderArchiveInfo | MultiSelectUnderArchiveInfo)[];
  fields: UnderArchiveFieldInfo[];
  path: string;
}

export type UnderCreateStudentArchiveGetInfoResponse =
  | UnderCreateStudentArchiveGetInfoSuccessResponse
  | CommonFailedResponse<ActionFailType.Expired | ActionFailType.Existed>;

const getCreateUnderStudentArchiveInfoLocal =
  async (): Promise<UnderCreateStudentArchiveGetInfoResponse> => {
    try {
      const { data: welcomePageContent } = await request<string>(
        `${UNDER_SYSTEM_SERVER}/ggxx/xj/bdzcsm.jsp?tktime=${getIETimeStamp()}`,
        { cookieScope: UNDER_SYSTEM_SERVER },
      );

      if (isWebVPNPage(welcomePageContent)) {
        cookieStore.clear();

        return ExpiredResponse;
      }

      if (
        welcomePageContent.includes("您已经提交了报到") ||
        /<input type="button" class="button" value="查看学籍信息"\s+onclick/.test(
          welcomePageContent,
        )
      )
        return {
          success: false,
          type: ActionFailType.Existed,
          msg: "学籍已建立",
        };

      const link = welcomePageContent.match(nextLinkRegExp)?.[1];

      if (!link)
        return {
          success: false,
          msg: "未找到注册学籍链接",
        };

      const { data: infoContent } = await request<string>(
        `${UNDER_SYSTEM_SERVER}${link}`,
        { cookieScope: UNDER_SYSTEM_SERVER },
      );

      if (infoContent.includes("不在控制范围内！"))
        return {
          success: false,
          type: ActionFailType.Existed,
          msg: "学籍已建立",
        };

      const info = Array.from(infoContent.matchAll(infoRowRegExp)).map(
        ([, ...matches]) =>
          matches.map((item) => item.replace(/&nbsp;/g, " ").trim()),
      );

      const readonlyFields = info.filter(([, , editable]) =>
        readonlyRegExp.test(editable),
      );

      const editableFields = info
        .filter(([, , editable]) => !readonlyRegExp.test(editable))
        .map(([text, defaultValue, checkBox, inputOrSelect, remark]) => {
          const [, checkboxValue, checkboxName] =
            checkBoxRegExp.exec(checkBox)!;

          const name = selectRegExp.exec(inputOrSelect)![1];

          const options = Array.from(inputOrSelect.matchAll(optionRegExp)).map(
            ([, value, text]) => ({ value, text }),
          );

          if (text === "火车到站") {
            const validOptions = options.filter(
              ({ value }) => Number(value) > 100,
            );

            const { category, values } = validOptions.reduce(
              (result, current) => {
                const trimmedText = current.text.trim();

                if (current.text === trimmedText) {
                  result.category.push(current);
                  result.values.push([current]);
                } else {
                  result.values[result.values.length - 1].push({
                    value: current.value,
                    text: trimmedText,
                  });
                }

                return result;
              },
              {
                category: [] as { value: string; text: string }[],
                values: [] as { value: string; text: string }[][],
              },
            );

            return {
              text,
              defaultValue,
              name,
              checkboxName,
              checkboxValue,
              category,
              values: values.map((item) => [
                { text: "请选择", value: "" },
                ...item.sort((a, b) => a.text.localeCompare(b.text)),
              ]),
              remark,
            };
          }

          return {
            text,
            defaultValue,
            name,
            checkboxName,
            checkboxValue,
            options,
            remark,
          };
        });

      const hiddenFields = Array.from(
        infoContent.matchAll(hiddenFieldsRegExp),
      ).map(([, name, value]) => ({ name, value }));

      return {
        success: true,
        readonly: readonlyFields.map(([text, value, , , remark]) => {
          const realValue = /<font[^>]*>(.*)<\/font>/.exec(value)?.[1] || value;

          return {
            text,
            value: realValue,
            remark,
          };
        }),
        editable: editableFields,
        fields: [
          ...readonlyFields
            .map(([, , , inputOrSelect]) => {
              let result = inputRegExp.exec(inputOrSelect);

              if (result) return { name: result[1], value: result[2] };

              result = selectRegExp.exec(inputOrSelect);

              if (result) return { name: result[1], value: "" };

              return null;
            })
            .filter(
              (item): item is { name: string; value: string } => item !== null,
            ),
          ...hiddenFields,
        ],
        path: pathRegExp.exec(infoContent)![1],
      };
    } catch (err) {
      logger.error(err);

      return {
        success: false,
        msg: (err as Error).message,
      };
    }
  };

const getCreateUnderStudentArchiveInfoOnline =
  (): Promise<UnderCreateStudentArchiveGetInfoResponse> =>
    onlineUnderStudentArchive<
      Record<never, never>,
      UnderCreateStudentArchiveGetInfoResponse
    >({}, { type: "get-info" });

export const getCreateUnderStudentArchiveInfo = createService(
  "create-under-archive",
  getCreateUnderStudentArchiveInfoLocal,
  getCreateUnderStudentArchiveInfoOnline,
);

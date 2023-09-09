import { logger, query } from "@mptool/all";

import type {
  UnderCreateStudentArchiveGetInfoResponse,
  UnderCreateStudentArchiveSubmitAddressOptions,
  UnderCreateStudentArchiveSubmitAddressResponse,
  UnderCreateStudentArchiveSubmitFamilyOptions,
  UnderCreateStudentArchiveSubmitFamilyResponse,
  UnderCreateStudentArchiveSubmitInfoOptions,
  UnderCreateStudentArchiveSubmitInfoResponse,
  UnderCreateStudentArchiveSubmitStudyOptions,
  UnderCreateStudentArchiveSubmitStudyResponse,
} from "./typings.js";
import { request } from "../../api/index.js";
import { service } from "../../config/info.js";
import {
  LoginFailType,
  UNDER_SYSTEM_SERVER,
  isWebVPNPage,
} from "../../login/index.js";
import { getIETimeStamp } from "../../utils/browser.js";
import { cookieStore } from "../../utils/cookie.js";

const nextLinkRegExp =
  /<input\s+type="button"\s+class="button"\s+onclick="window.location.href='([^']+)';"\s+value=" 下一步 "\/>/;
const pathRegExp = /<form action="([^"]+)"/;
const infoRowRegExp =
  /<tr height="25px"\s*><td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<\/tr>/g;
const info2RowRegExp =
  /<tr height="25px"\s*><td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<td[^>]+>(.*?)<\/td>\s*<\/tr>/g;
const requiredRegExp = /<font color="red">\*<\/font>/;
const readonlyRegExp = /<font[^>]+>ø<\/font>/;
const inputRegExp = /<input[^>]*name="(.*?)"[^>]*value="(.*?)"[^>]*\/>/;
const checkBoxRegExp =
  /<input type="checkbox" value="(.*?)" id="gx" name="(.*?)"[^>]+\/>/;
const selectRegExp = /<select[^>]+name="(.*?)"/;
const optionRegExp = /<option value="([^"]+)">([^<]*?)<\/option>/g;
const fieldsRegExp =
  /<input\s+type="text"[^>]+name="(.*?)"\s+id=".*?"\s+value="(.*?)"[^>]+\/>/g;
const hiddenFieldsRegExp =
  /<input\s+type="hidden"[^>]+name="(.*?)"\s*value="(.*?)"\s*\/>/g;
const studyDataRegExp = /"brjl"\s*:\s*(\[.*?\])/;
const familyDataRegExp = /"jtcy"\s*:\s*(\[.*?\])/;

export const getUnderStudentArchiveInfo =
  async (): Promise<UnderCreateStudentArchiveGetInfoResponse> => {
    const welcomePageContent = await request<string>(
      `${UNDER_SYSTEM_SERVER}/ggxx/xj/bdzcsm.jsp?tktime=${getIETimeStamp()}`,
      { scope: UNDER_SYSTEM_SERVER },
    );

    if (isWebVPNPage(welcomePageContent)) {
      cookieStore.clear();

      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录已过期，请重新登录",
      };
    }

    if (welcomePageContent.includes("您已经提交了报到"))
      return {
        success: false,
        type: "created",
        msg: "学籍已建立",
      };

    const link = welcomePageContent.match(nextLinkRegExp)?.[1];

    if (!link)
      return {
        success: false,
        msg: "未找到注册学籍链接",
      };

    const infoContent = await request<string>(`${UNDER_SYSTEM_SERVER}${link}`, {
      scope: UNDER_SYSTEM_SERVER,
    });

    if (infoContent.includes("不在控制范围内！"))
      return {
        success: false,
        type: "created",
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
        const [, checkboxValue, checkboxName] = checkBoxRegExp.exec(checkBox)!;

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
              category: <{ value: string; text: string }[]>[],
              values: <{ value: string; text: string }[][]>[],
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
  };

export const submitUnderStudentArchiveInfo = async ({
  path,
  fields,
}: UnderCreateStudentArchiveSubmitInfoOptions): Promise<UnderCreateStudentArchiveSubmitInfoResponse> => {
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
};

export const submitUnderStudentArchiveAddress = async ({
  path,
  fields,
}: UnderCreateStudentArchiveSubmitAddressOptions): Promise<UnderCreateStudentArchiveSubmitAddressResponse> => {
  const content = await request<string>(`${UNDER_SYSTEM_SERVER}${path}`, {
    method: "POST",
    header: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    data: query.stringify(
      Object.fromEntries(fields.map(({ name, value }) => [name, value])),
    ),
  });

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
};

export const submitUnderStudentArchiveStudy = async ({
  path,
  fields,
  study,
}: UnderCreateStudentArchiveSubmitStudyOptions): Promise<UnderCreateStudentArchiveSubmitStudyResponse> => {
  if (study.length === 0) throw new Error("至少有1条学习与工作经历记录");
  if (study.length > 15) throw new Error("最多只能添加15条学习与工作经历记录");
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

  const existingData = familyDataRegExp.exec(content)?.[1];

  const family = existingData
    ? (<
        {
          gxm: string;
          cyxm: string;
          gzdw: string;
          cym: string;
          gzdwxq: string;
        }[]
      >JSON.parse(existingData)).map(({ gxm, cyxm, gzdw, cym, gzdwxq }) => ({
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
};

export const submitUnderStudentArchiveFamily = async ({
  path,
  fields,
  family,
}: UnderCreateStudentArchiveSubmitFamilyOptions): Promise<UnderCreateStudentArchiveSubmitFamilyResponse> => {
  if (family.length === 0) throw new Error("至少有1条家庭成员记录");
  if (family.length > 15) throw new Error("最多只能添加15条家庭成员记录");

  const params: Record<string, string> = Object.fromEntries(
    fields.map(({ name, value }) => [name, value]),
  );

  family.forEach(({ name, relation, office, title, phone }, index) => {
    if (name === "") throw new Error(`第${index + 1}条家庭成员记录姓名缺失。`);
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

  console.log(content);

  return {
    success: false,
    msg: "未知错误",
  };
};

const onlineUnderStudentArchive = <Option, Response>(
  options: Option,
  additionalOptions: Record<string, unknown> = {},
): Promise<Response> => <Promise<Response>>request(
    `${service}under-system/create-archive`,
    {
      method: "POST",
      data: { ...additionalOptions, ...options },
      scope: UNDER_SYSTEM_SERVER,
    },
  ).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

export const getOnlineUnderStudentArchiveInfo =
  (): Promise<UnderCreateStudentArchiveGetInfoResponse> =>
    onlineUnderStudentArchive<
      Record<never, never>,
      UnderCreateStudentArchiveGetInfoResponse
    >({}, { type: "get-info" });

export const submitOnlineUnderStudentArchiveInfo = (
  options: UnderCreateStudentArchiveSubmitInfoOptions,
): Promise<UnderCreateStudentArchiveSubmitInfoResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitInfoOptions,
    UnderCreateStudentArchiveSubmitInfoResponse
  >(options, { type: "submit-info" });

export const submitOnlineUnderStudentArchiveAddress = (
  options: UnderCreateStudentArchiveSubmitAddressOptions,
): Promise<UnderCreateStudentArchiveSubmitAddressResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitAddressOptions,
    UnderCreateStudentArchiveSubmitAddressResponse
  >(options, { type: "submit-address" });

export const submitOnlineUnderStudentArchiveStudy = (
  options: UnderCreateStudentArchiveSubmitStudyOptions,
): Promise<UnderCreateStudentArchiveSubmitStudyResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitStudyOptions,
    UnderCreateStudentArchiveSubmitStudyResponse
  >(options, { type: "submit-info" });

export const submitOnlineUnderStudentArchiveFamily = (
  options: UnderCreateStudentArchiveSubmitFamilyOptions,
): Promise<UnderCreateStudentArchiveSubmitFamilyResponse> =>
  onlineUnderStudentArchive<
    UnderCreateStudentArchiveSubmitFamilyOptions,
    UnderCreateStudentArchiveSubmitFamilyResponse
  >(options, { type: "submit-info" });

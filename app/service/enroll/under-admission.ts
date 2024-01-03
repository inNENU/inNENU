import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

export interface UnderAdmissionPostOptions {
  name: string;
  id: string;
  testId: string;
}

interface RawEnrollSuccessResult {
  name: string;
  institute: string;
  major: string;
  mailCode: string;
  hasMailed: string;
  admissionMethod: string;
}

interface RawEnrollFailedResult {
  code: -1;
}

type RawEnrollResult = RawEnrollSuccessResult | RawEnrollFailedResult;

export interface UnderAdmissionSuccessResponse {
  success: true;
  info: { text: string; value: string }[];
}

export type UnderAdmissionResponse =
  | UnderAdmissionSuccessResponse
  | CommonFailedResponse;

export const getUnderAdmission = async ({
  testId,
  id,
  name,
}: UnderAdmissionPostOptions): Promise<UnderAdmissionResponse> => {
  const { data: result, status } = await request<RawEnrollResult>(
    "https://bkzsw.nenu.edu.cn/query",
    {
      method: "POST",
      body: {
        name,
        idCode: id,
        stuCode: testId,
      },
    },
  );

  if (status !== 200)
    return {
      success: false,
      msg: "查询通道已关闭",
    };

  if ("code" in result)
    return {
      success: false,
      msg: "查询失败",
    };

  const { institute, major, mailCode, hasMailed, admissionMethod } = result;

  const info = [
    {
      text: "姓名",
      value: name,
    },
    {
      text: "考生号",
      value: testId,
    },
    {
      text: "招生方式",
      value: admissionMethod,
    },
    {
      text: "录取专业",
      value: major,
    },
    {
      text: "所在学院",
      value: institute,
    },
    {
      text: "录取通知书单号",
      value: mailCode,
    },
    {
      text: "是否已寄出",
      value: hasMailed ? "是" : "否",
    },
  ];

  return {
    success: true,
    info,
  };
};

export const getOnlineUnderAdmission = (
  options: UnderAdmissionPostOptions,
): Promise<UnderAdmissionResponse> =>
  request<UnderAdmissionResponse>("/enroll/under-admission", {
    method: "POST",
    ...(options ? { body: options } : {}),
  }).then(({ data }) => data);

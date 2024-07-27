import { request } from "../../../../api/index.js";
import type { CommonFailedResponse } from "../../../../service/index.js";
import {
  ActionFailType,
  UnknownResponse,
  createService,
} from "../../../../service/index.js";

const QUERY_URL = "https://gkcx.nenu.edu.cn/api/user/admissionQuery";

export interface UnderAdmissionOptions {
  name: string;
  id: string;
  testId: string;
}

interface RawEnrollSuccessResult {
  student: {
    name: string;
    department: string;
    major: string;
    // eslint-disable-next-line @typescript-eslint/naming-convention
    mail_code?: {
      String: string;
      Valid: true;
    };
    // eslint-disable-next-line @typescript-eslint/naming-convention
    is_mailed: string;
  };
}

interface RawEnrollFailedResult {
  message: string;
  student: null;
}

type RawEnrollResult = RawEnrollSuccessResult | RawEnrollFailedResult;

export interface UnderAdmissionSuccessResponse {
  success: true;
  info: { text: string; value: string }[];
}

export type UnderAdmissionResponse =
  | UnderAdmissionSuccessResponse
  | CommonFailedResponse<ActionFailType.Closed | ActionFailType.Unknown>;

const getUnderAdmissionLocal = async ({
  testId,
  id,
  name,
}: UnderAdmissionOptions): Promise<UnderAdmissionResponse> => {
  const { data, headers } = await request<RawEnrollResult>(QUERY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      id_code: id,
      // eslint-disable-next-line @typescript-eslint/naming-convention
      student_code: testId,
    }),
  });

  if (!headers.get("content-type")?.includes("application/json"))
    return {
      success: false,
      type: ActionFailType.Closed,
      msg: "查询通道已关闭",
    };

  if (data.student === null) return UnknownResponse(data.message);

  const {
    department,
    major,
    mail_code: mailCode,
    is_mailed: hasMailed,
  } = data.student;

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
      text: "录取专业",
      value: major,
    },
    {
      text: "所在学院",
      value: department,
    },
    {
      text: "录取通知书单号",
      value: hasMailed ? (mailCode?.String ?? "暂无") : "暂无",
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

const getUnderAdmissionOnline = (
  options: UnderAdmissionOptions,
): Promise<UnderAdmissionResponse> =>
  request<UnderAdmissionResponse>("/enroll/under-admission", {
    method: "POST",
    ...(options ? { body: options } : {}),
  }).then(({ data }) => data);

export const getUnderAdmission = createService(
  "under-admission",
  getUnderAdmissionLocal,
  getUnderAdmissionOnline,
);

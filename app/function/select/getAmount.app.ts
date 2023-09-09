import { query } from "@mptool/all";

import type {
  StudentAmountData,
  StudentAmountOptions,
  StudentAmountRaw,
  StudentAmountResponse,
} from "./typings";
import { request } from "../../api/index.js";
import { LoginFailType } from "../../login/index.js";

export const getAmount = async ({
  server,
  courseId,
  jx0502id,
}: StudentAmountOptions): Promise<StudentAmountResponse> => {
  try {
    const url = `${server}xk/GetXkRs`;
    const params = query.stringify({
      jx0502id,
      kch: courseId,
    });

    const rawData = await request<string | StudentAmountRaw[]>(url, {
      method: "POST",
      header: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Content-Type": "application/x-www-form-urlencoded",
      },
      data: params,
    });

    if (typeof rawData === "string")
      return {
        success: false,
        msg: "请重新登录",
        type: LoginFailType.Expired,
      };

    const data: StudentAmountData[] = rawData.map(({ jx0404id, rs }) => ({
      cid: jx0404id,
      amount: rs,
    }));

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      msg: (<Error>err).message,
    };
  }
};

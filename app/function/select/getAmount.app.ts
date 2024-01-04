import { URLSearchParams } from "@mptool/all";

import type {
  StudentAmountData,
  StudentAmountOptions,
  StudentAmountRaw,
  StudentAmountResponse,
} from "./typings";
import { request } from "../../api/index.js";
import { LoginFailType } from "../../service/index.js";

export const getAmount = async ({
  server,
  courseId,
  jx0502id,
}: StudentAmountOptions): Promise<StudentAmountResponse> => {
  try {
    const url = `${server}xk/GetXkRs`;

    const { data: rawData } = await request<string | StudentAmountRaw[]>(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        jx0502id,
        kch: courseId,
      }),
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

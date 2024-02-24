import type { MyLoginFailedResponse } from "./login.js";
import { MY_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";

interface IdentityInfo {
  success: true;
  sf: "bks" | "yjs" | "lxs" | "jzg";
}

export interface MyIdentity {
  /** 用户类型代码 */
  type: "bks" | "yjs" | "lxs" | "jzg";
}

export interface MyIdentitySuccessResponse {
  success: true;
  data: MyIdentity;
}

export type MyIdentityResponse =
  | MyIdentitySuccessResponse
  | MyLoginFailedResponse
  | CommonFailedResponse;

export const myIdentity = async (): Promise<MyIdentityResponse> => {
  try {
    const { data: identityResult } = await request<IdentityInfo>(
      `${MY_SERVER}/hallIndex/getidentity`,
      {
        method: "POST",
        headers: {
          Accept: "application/json, text/javascript, */*; q=0.01",
        },
      },
    );

    if (identityResult.success)
      return {
        success: true,
        data: {
          type: identityResult.sf,
        },
      };

    return {
      success: false,
      msg: "获取人员身份失败",
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      msg: "获取人员身份失败",
    };
  }
};

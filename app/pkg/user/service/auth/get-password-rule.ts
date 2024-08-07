import { RESET_PREFIX } from "./utils.js";
import { request } from "../../../../api/index.js";

const GET_PASSWORD_RULE = `${RESET_PREFIX}/getAllPwdRules`;

interface RawPasswordRuleResponse {
  code: "0";
  message: "SUCCESS";
  datas: string[];
}

export interface GetPasswordRuleResponse {
  success: true;
  data: string[];
}

export const getPasswordRule = async (): Promise<GetPasswordRuleResponse> => {
  const { data } = await request<RawPasswordRuleResponse>(GET_PASSWORD_RULE, {
    method: "POST",
    body: {},
  });

  return {
    success: true,
    data: data.datas,
  };
};

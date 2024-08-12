// import { request } from "../../api/index.js";
// import { appID, env, user } from "../../state/index.js";

// export interface RemoveInfo {
//   openid: string;
//   isAdmin: boolean;
//   inBlacklist: boolean;
// }

// export const mpLogin = (code?: string): Promise<LoginInfo> =>
//   request<LoginInfo>("/mp/login", {
//     method: "POST",
//     body: code ? { appID, code, env } : { openid: user.openid },
//   }).then(({ data }) => data);

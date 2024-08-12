import { request } from "../../api/index.js";
import { appID, user } from "../../state/index.js";

export interface RemoveInfo {
  success: boolean;
}

export const mpRemove = (): Promise<RemoveInfo> =>
  request<RemoveInfo>("/mp/remove", {
    method: "POST",
    body: user.account
      ? { appID, id: user.account?.id, authToken: user.account?.authToken }
      : {},
  }).then(({ data }) => data);

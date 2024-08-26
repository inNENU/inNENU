import { request } from "../../api/index.js";
import type { CommonSuccessResponse } from "../utils/index.js";

export type BlacklistResponse = CommonSuccessResponse<{
  inBlacklist: boolean;
}>;

export const inBlackList = (id: number): Promise<boolean> =>
  request<BlacklistResponse>(`/mp/blacklist?id=${id}`).then(
    ({ data }) => data.data.inBlacklist,
  );

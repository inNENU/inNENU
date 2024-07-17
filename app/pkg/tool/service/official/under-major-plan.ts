import { request } from "../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../service/index.js";
import {
  OFFICIAL_URL,
  UnknownResponse,
  createService,
} from "../../../../service/index.js";

const UNDER_MAJOR_PLAN_URL = `${OFFICIAL_URL}/jyjx/bksjy/rcpyfa.htm`;

const MAJOR_PLAN_LIST_REGEXP = /<ul class="table2[^>]*?>([^]*?)<\/ul>/;
const MAJOR_PLAN_ITEM_REGEXP = /<li><p><a href="(.*?)">(.*?)<\/a><\/p><\/li>/g;

export type UnderMajorPlanSuccessResponse = CommonSuccessResponse<
  { name: string; url: string }[]
>;

export type UnderMajorPlanResponse =
  | UnderMajorPlanSuccessResponse
  | CommonFailedResponse;

export const getUnderMajorPlanLocal =
  async (): Promise<UnderMajorPlanResponse> => {
    try {
      const { data: html, status } =
        await request<string>(UNDER_MAJOR_PLAN_URL);

      if (status !== 200) throw new Error("请求失败");

      const listContent = html.match(MAJOR_PLAN_LIST_REGEXP)?.[1];

      if (!listContent) throw new Error("未找到列表");

      const list = Array.from(listContent.matchAll(MAJOR_PLAN_ITEM_REGEXP)).map(
        ([, url, name]) => ({
          name,
          url: `${OFFICIAL_URL}${url}`,
        }),
      );

      return {
        success: true,
        data: list,
      };
    } catch (err) {
      const { message } = err as Error;

      console.error(err);

      return UnknownResponse(message);
    }
  };

export const getUnderMajorPlanOnline = (): Promise<UnderMajorPlanResponse> =>
  request<UnderMajorPlanResponse>("/official/under-major-plan").then(
    ({ data }) => data,
  );

export const getUnderMajorPlan = createService(
  "under-major-plan",
  getUnderMajorPlanLocal,
  getUnderMajorPlanOnline,
);

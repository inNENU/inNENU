import { request } from "../../../../../api/net.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../../service/index.js";
import {
  ActionFailType,
  UnknownResponse,
  createService,
} from "../../../../../service/index.js";
import { withUnderStudyLogin } from "../login.js";
import { UNDER_STUDY_SERVER } from "../utils.js";

export interface UnderSelectAllowedCategoryItem {
  /** 分类名称 */
  name: string;
  /** 分类链接 */
  link: string;
  /** 学期 */
  term: string;
  /** 是否可选课 */
  canSelect: true;
  /** 是否是公共课程 */
  isPublic: boolean;
  /** 选课阶段 */
  stage: string;
  /** 是否可退选 */
  canRemove: boolean;
  /** 分类开始时间 */
  startTime: string;
  /** 分类结束时间 */
  endTime: string;
}

export interface UnderSelectDisallowedCategoryItem {
  /** 分类名称 */
  name: string;
  /** 分类链接 */
  link: string;
  /** 学期 */
  term: string;
  /** 是否可选课 */
  canSelect: false;
  /** 说明 */
  description: string;
}

export interface UnderSelectCategoryInfo {
  allowed: UnderSelectAllowedCategoryItem[];
  disallowed: UnderSelectDisallowedCategoryItem[];
}

export type UnderSelectCategorySuccessResponse =
  CommonSuccessResponse<UnderSelectCategoryInfo>;

export type UnderSelectCategoryResponse =
  | UnderSelectCategorySuccessResponse
  | CommonFailedResponse<
      | ActionFailType.NotInitialized
      | ActionFailType.MissingCredential
      | ActionFailType.Unknown
    >;

const CATEGORY_PAGE = `${UNDER_STUDY_SERVER}/new/student/xsxk/`;

const ALLOWED_CATEGORY_ITEM_REGEXP =
  /<div id="bb2"[^]+?lay-tips="选课学期:(.*?)\s*<br>现在是(.*?)阶段\s*<br>(.*?)\s*"\s+lay-iframe="(.*?)"\s+data-href="(.*?)">[^]+?<div class="description">([^]+?)<br>([^]+?)<br><\/div>/g;
const DISALLOWED_CATEGORY_ITEM_REGEXP =
  /<div id="bb1"[^]+?lay-tips="选课学期:(.*?)\s*<br>\s*([^"]+?)\s*"\s+lay-iframe="(.*?)"\s+data-href="(.*?)"/g;

const getSelectCategories = (content: string): UnderSelectCategoryInfo => ({
  allowed: Array.from(content.matchAll(ALLOWED_CATEGORY_ITEM_REGEXP)).map(
    ([, term, stage, canRemoveText, name, link, startTime, endTime]) => ({
      term,
      stage,
      canRemove: canRemoveText === "可退选",
      name,
      link,
      startTime,
      endTime,
      canSelect: true,
      isPublic: name.includes("公共课程"),
    }),
  ),
  disallowed: Array.from(content.matchAll(DISALLOWED_CATEGORY_ITEM_REGEXP)).map(
    ([, term, description, name, link]) => ({
      term,
      description: description
        .split("<hr>")
        .map((line) => line.trim())
        .filter((line) => line.length)
        .join("\n"),
      name,
      link,
      canSelect: false,
    }),
  ),
});

const getUnderSelectCategoriesLocal =
  async (): Promise<UnderSelectCategoryResponse> => {
    try {
      const { data: content } = await request<string>(CATEGORY_PAGE);

      if (content.includes("选课正在初始化")) {
        return {
          success: false,
          type: ActionFailType.NotInitialized,
          msg: "选课正在初始化，请稍后再试",
        };
      }

      return {
        success: true,
        data: getSelectCategories(content),
      };
    } catch (err) {
      const { message } = err as Error;

      console.error(err);

      return UnknownResponse(message);
    }
  };

const getUnderSelectCategoriesOnline =
  async (): Promise<UnderSelectCategoryResponse> =>
    request<UnderSelectCategoryResponse>("/under-study/select/category", {
      method: "POST",
      cookieScope: UNDER_STUDY_SERVER,
    }).then(({ data }) => data);

export const getUnderSelectCategories = withUnderStudyLogin(
  createService(
    "under-select-category",
    getUnderSelectCategoriesLocal,
    getUnderSelectCategoriesOnline,
  ),
);

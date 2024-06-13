import { URLSearchParams } from "@mptool/all";

import { UNDER_STUDY_SERVER } from "./utils.js";
import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/net.js";
import { LoginFailType } from "../loginFailTypes.js";
import { createService } from "../utils.js";

export interface GetUnderCourseCommentaryListOptions {
  type: "list";
  /** 查询时间 */
  time?: string;
}

interface RawUnderCourseCommentaryListResultItem {
  rownum_: number;
  /** 教师编号 */
  teabh: string;
  /** 教师代码 */
  teadm: string;
  /** 评价代码 */
  pjdm: string;
  /** 课程代码 */
  dgksdm: string;
  /** 教师姓名 */
  teaxm: string;
  /** 教学环节代码 */
  jxhjdm: string;
  /** 教学环节名称 */
  jxhjmc: string;
  /** 结课日期 */
  jkrq: string;
  /** 学年学期代码 */
  xnxqdm: string;
  /** 课程名称 */
  kcmc: string;
  kcrwdm: string;
  /** 修读学期 */
  xnxqmc: string;
  /** 学生代码 */
  xsdm: string;
}

interface RawUnderCourseCommentaryListSuccessResult {
  data: "";
  rows: RawUnderCourseCommentaryListResultItem[];
  total: number;
}

interface RawUnderCourseCommentaryListFailedResult {
  code: number;
  data: string;
  message: string;
}

type RawUnderCourseCommentaryListResult =
  | RawUnderCourseCommentaryListSuccessResult
  | RawUnderCourseCommentaryListFailedResult;

export interface UnderCourseCommentaryItem {
  /** 修读学期 */
  term: string;
  /** 结课日期 */
  endDate: string;
  /** 课程名称 */
  name: string;
  /** 教师名称 */
  teacherName: string;
  /** 课程代码 */
  courseCode: string;
  /** 教师代码 */
  teacherCode: string;
  /** 教学环节名称 */
  teachingLinkName: string;
  /** 评价代码 */
  commentaryCode: string;
}

export interface UnderCourseCommentaryListSuccessResponse {
  success: true;
  data: UnderCourseCommentaryItem[];
}

export type UnderCourseCommentaryListResponse =
  | UnderCourseCommentaryListSuccessResponse
  | (CommonFailedResponse & {
      type?: LoginFailType.Expired;
    });

export interface GetUnderCourseCommentaryOptions {
  type: "get";
  /** 教师代码 */
  teacherCode: string;
  /** 课程代码 */
  courseCode: string;
}

interface RawUnderCourseCommentaryScore {
  dtjg: string;
  xzpf: number;
  yjfk: "";
  zbdm: string;
  zbfz: number;
  zbmc: string;
}

export interface ViewUnderCourseCommentaryOptions {
  type: "view";
  commentaryCode: string;
}

export interface UnderCourseCommentaryScoreItem {
  name: string;
  answer: string;
  score: number;
}

export interface UnderCourseCommentaryViewSuccessResponse {
  success: true;
  data: UnderCourseCommentaryScoreItem[];
}

export type UnderCourseCommentaryViewResponse =
  | UnderCourseCommentaryViewSuccessResponse
  | CommonFailedResponse;

export interface UnderCourseCommentaryInfo {
  /** 参数 */
  params: Record<string, string>;
  /** 问题 */
  questions: {
    /** 标题 */
    title: string;
    txdm: string;
    zbdm: string;
    options: {
      /** 选项文字 */
      text: string;
      /** 分数 */
      score: number;
      name: string;
      value: string;
    }[];
  }[];
  /** 评语 */
  text: {
    /** 评语标题 */
    title: string;
    txdm: string;
    zbdm: string;
    name: string;
  };
}

export interface SubmitUnderCourseCommentaryOptions
  extends UnderCourseCommentaryInfo {
  type: "submit";
  /** 选项 */
  answers: number[];
  /** 评语 */
  commentary: string;
}

interface RawUnderCourseCommentarySubmitSuccessResult {
  code: 0;
  data: "";
  message: "评价成功";
}

interface RawUnderCourseCommentaryListFailedResult {
  code: number;
  data: string;
  message: string;
}

type RawUnderCourseCommentarySubmitResult =
  | RawUnderCourseCommentarySubmitSuccessResult
  | RawUnderCourseCommentaryListFailedResult;

export interface UnderCourseCommentaryGetSuccessResponse {
  success: true;
  data: UnderCourseCommentaryInfo;
}

export type UnderCourseCommentaryGetResponse =
  | UnderCourseCommentaryGetSuccessResponse
  | CommonFailedResponse;

export interface UnderCourseCommentarySubmitSuccessResponse {
  success: true;
  data: string;
}

export type UnderCourseCommentarySubmitResponse =
  | UnderCourseCommentarySubmitSuccessResponse
  | CommonFailedResponse;

const MAIN_URL = `${UNDER_STUDY_SERVER}/new/student/teapj`;
const LIST_URL = `${UNDER_STUDY_SERVER}/new/student/teapj/pjDatas`;
const VIEW_URL = `${UNDER_STUDY_SERVER}/new/student/teapj/viewPjData`;
const ANSWER_URL = `${UNDER_STUDY_SERVER}/new/student/teapj/pj.page`;

const SELECTED_OPTION_REG =
  /<option value='([^']*?)' selected>([^<]*?)<\/option>/;

const getCurrentTime = async (): Promise<{ time: string; value: string }> => {
  const { data: content } = await request<string>(MAIN_URL);

  const timeMatch = SELECTED_OPTION_REG.exec(content);

  if (!timeMatch) throw new Error("无法获取当前评教日期");

  const [, value, time] = timeMatch;

  return {
    time,
    value,
  };
};

const getCourseList = (
  records: RawUnderCourseCommentaryListResultItem[],
): UnderCourseCommentaryItem[] =>
  records.map(
    ({
      xnxqmc: term,
      jkrq: endDate,
      kcmc: name,
      dgksdm: courseCode,
      teaxm: teacherName,
      teadm: teacherCode,
      jxhjmc: teachingLinkName,
      pjdm: commentaryCode,
    }) => ({
      term,
      endDate,
      name,
      courseCode,
      teacherName,
      teacherCode,
      teachingLinkName,
      commentaryCode,
    }),
  );

const getCourseCommentary = (
  records: RawUnderCourseCommentaryScore[],
): UnderCourseCommentaryScoreItem[] =>
  records.map(({ zbfz: score, zbmc: name, dtjg: answer }) => ({
    name,
    answer,
    score,
  }));

const PARAMS_REGEXP = /'\/new\/student\/teapj\/savePj',\s+\{\s+([^]*?)\s+wtpf:/;
const PARAMS_ITEM_REGEXP = /\b([^:]+): ?'([^']+)',/;
const OPTIONS_REGEXP =
  /<div class="question".+?data-txdm="(\d+)" data-zbdm="(\d+)">\s+<h3>(.*?)(?:<span class="zbsx" style="color:red;">.*?<\/span>)?\s+<\/h3>\s+<input.+?name="(\d+)"\s+?value="(\d+)"[^]+?data-fz="(.+?)"\s+data-mc="(.+?)" \/>[^]+?<input.+?name="(\d+)"\s+?value="(\d+)"[^]+?data-fz="(.+?)"\s+data-mc="(.+?)" \/>[^]+?<input.+?name="(\d+)"\s+?value="(\d+)"[^]+?data-fz="(.+?)"\s+data-mc="(.+?)" \/>[^]+?<input.+?name="(\d+)"\s+?value="(\d+)"[^]+?data-fz="(.+?)"\s+data-mc="(.+?)" \/>[^]+?<input.+?name="(\d+)"\s+?value="(\d+)"[^]+?data-fz="(.+?)"\s+data-mc="(.+?)" \/>[^]+?<input.+?name="(\d+)"\s+?value="(\d+)"[^]+?data-fz="(.+?)"\s+data-mc="(.+?)" \/>[^]+?<\/div>/g;
const TEXT_REGEXP =
  /<div class="question".+?data-txdm="(\d+)" data-zbdm="(\d+)">\s+<h3>(.*?)(?:<span class="zbsx" style="color:red;">.*?<\/span>)?\s+<\/h3>\s+<textarea.+?name="(\d+)"[^]+?data-fz="(.*?)"/;

const getCourseInfo = (html: string): UnderCourseCommentaryInfo => {
  const paramText = PARAMS_REGEXP.exec(html)![1];

  const params = Object.fromEntries(
    paramText
      .split("\n")
      .map((line) => PARAMS_ITEM_REGEXP.exec(line)!)
      .map(([, key, value]) => [key, value]),
  );

  const questions = Array.from(html.matchAll(OPTIONS_REGEXP)).map(
    ([, txdm, zbdm, title, ...items]) => {
      const optionNumber = items.length / 4;

      return {
        txdm,
        zbdm,
        title,
        options: new Array(optionNumber).fill(null).map((_, index) => {
          const [name, value, score, text] = items.slice(
            index * 4,
            index * 4 + 4,
          );

          return {
            name,
            value,
            score: Number(score),
            text,
          };
        }),
      };
    },
  );

  const [, txdm, zbdm, title, name] = TEXT_REGEXP.exec(html)!;

  return {
    params,
    questions,
    text: {
      txdm,
      zbdm,
      title,
      name,
    },
  };
};

export type UnderCourseCommentaryOptions =
  | ViewUnderCourseCommentaryOptions
  | GetUnderCourseCommentaryListOptions
  | GetUnderCourseCommentaryOptions
  | SubmitUnderCourseCommentaryOptions;

export type UnderCourseCommentaryResponse<
  T extends UnderCourseCommentaryOptions,
> = T extends GetUnderCourseCommentaryListOptions
  ? UnderCourseCommentaryListResponse
  : T extends ViewUnderCourseCommentaryOptions
    ? UnderCourseCommentaryViewResponse
    : T extends GetUnderCourseCommentaryOptions
      ? UnderCourseCommentaryGetResponse
      : UnderCourseCommentarySubmitResponse;

const underStudyCourseCommentaryLocal = async <
  T extends UnderCourseCommentaryOptions,
>(
  options: T,
): Promise<UnderCourseCommentaryResponse<T>> => {
  try {
    if (options.type === "list") {
      const time = options.time ?? (await getCurrentTime()).value;

      const { data, headers } =
        await request<RawUnderCourseCommentaryListResult>(LIST_URL, {
          method: "POST",
          headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
          },
          body: new URLSearchParams({
            xnxqdm: time,
            source: "kccjlist",
            primarySort: "kcrwdm asc",
            page: "1",
            rows: "150",
            sort: "jkrq",
            order: "asc",
          }),
        });

      if (headers.get("content-type")?.includes("text/html"))
        return {
          success: false,
          type: LoginFailType.Expired,
          msg: "登录过期，请重新登录",
        } as UnderCourseCommentaryResponse<T>;

      if ("code" in data) {
        if (data.message === "尚未登录，请先登录")
          return {
            success: false,
            type: LoginFailType.Expired,
            msg: "登录过期，请重新登录",
          } as UnderCourseCommentaryResponse<T>;

        return {
          success: false,
          msg: data.message,
        } as UnderCourseCommentaryResponse<T>;
      }

      return {
        success: true,
        data: getCourseList(data.rows),
      } as UnderCourseCommentaryResponse<T>;
    }

    if (options.type === "view") {
      const { data } = await request<RawUnderCourseCommentaryScore[]>(
        `${VIEW_URL}?pjdm=${options.commentaryCode}`,
        {
          headers: {
            Accept: "application/json, text/javascript, */*; q=0.01",
          },
        },
      );

      return {
        success: true,
        data: getCourseCommentary(data),
      } as UnderCourseCommentaryResponse<T>;
    }

    if (options.type === "get") {
      const { courseCode, teacherCode } = options;
      const urlParams = new URLSearchParams({
        teadm: teacherCode,
        dgksdm: courseCode,
        _: Date.now().toString(),
      }).toString();

      const { data: content } = await request<string>(
        `${ANSWER_URL}?${urlParams}`,
      );

      return {
        success: true,
        data: getCourseInfo(content),
      } as UnderCourseCommentaryResponse<T>;
    }

    const { params, questions, text, answers } = options;

    const { data, headers } =
      await request<RawUnderCourseCommentarySubmitResult>(
        `${UNDER_STUDY_SERVER}/new/student/teapj/savePj`,
        {
          method: "POST",
          headers: {
            Accept: "application/json; charset=UTF-8",
          },
          body: new URLSearchParams({
            ...params,
            wtpf:
              answers
                .reduce(
                  (acc, answer, index) =>
                    acc + Number(questions[index].options[answer].score),
                  0,
                )
                .toString() + ".00",
            dt: JSON.stringify([
              ...questions.map(({ txdm, zbdm, title }, index) => {
                const { text, value, score } =
                  questions[index].options[answers[index]];

                return {
                  txdm,
                  zbdm,
                  zbmc: title,
                  zbxmdm: value,
                  fz: score,
                  dtjg: text,
                };
              }),
              {
                txdm: text.txdm,
                zbdm: text.zbdm,
                zbmc: text.title,
                fz: 0,
                dtjg: options.commentary,
              },
            ]),
          }),
        },
      );

    if (headers.get("content-type")?.includes("text/html"))
      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录过期，请重新登录",
      } as UnderCourseCommentaryResponse<T>;

    if (data.code === 0) {
      return {
        success: true,
        data: data.message,
      } as UnderCourseCommentaryResponse<T>;
    }

    if (data.message === "尚未登录，请先登录")
      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录过期，请重新登录",
      } as UnderCourseCommentaryResponse<T>;

    return {
      success: false,
      msg: data.message,
    } as UnderCourseCommentaryResponse<T>;
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as UnderCourseCommentaryResponse<T>;
  }
};

const underStudyCourseCommentaryOnline = async <
  T extends UnderCourseCommentaryOptions,
>(
  options: T,
): Promise<UnderCourseCommentaryResponse<T>> =>
  request<UnderCourseCommentaryResponse<T>>("/under-study/course-commentary", {
    method: "POST",
    body: options,
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const underStudyCourseCommentary = createService(
  "under-course-commentary",
  underStudyCourseCommentaryLocal,
  underStudyCourseCommentaryOnline,
);

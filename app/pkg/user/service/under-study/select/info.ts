import { request } from "../../../../../api/index.js";
import type {
  CommonFailedResponse,
  CommonSuccessResponse,
} from "../../../../../service/index.js";
import { ActionFailType, createService } from "../../../../../service/index.js";
import { withUnderStudyLogin } from "../login.js";
import { UNDER_STUDY_SERVER } from "../utils.js";

const CHECK_URL = `${UNDER_STUDY_SERVER}/new/student/xsxk/checkFinishPj`;

export interface SelectOptionConfig {
  value: string;
  name: string;
}

export interface UnderSelectBaseInfo {
  /** 学期 */
  term: string;
  /** 选课名称 */
  name: string;
  /** 是否可以选课 */
  canSelect: boolean;

  /** 可用年级 */
  grades: number[];
  /** 可用校区 */
  areas: SelectOptionConfig[];
  /** 可用专业 */
  majors: SelectOptionConfig[];
  /** 可用开课单位 */
  offices: SelectOptionConfig[];
  /** 可用课程类别 */
  types: SelectOptionConfig[];
  /** 可用课程分类 */
  categories: SelectOptionConfig[];

  /** 当前校区 */
  currentArea: string;
  /** 当前专业 */
  currentMajor: string;
  /** 当前年级 */
  currentGrade: number;
}

export interface UnderSelectAllowedInfo extends UnderSelectBaseInfo {
  canSelect: true;

  /** 是否可退选 */
  canCancel: boolean;
  /** 选课阶段 */
  stage: string;
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
}

export interface UnderSelectDisallowedInfo extends UnderSelectBaseInfo {
  canSelect: false;
}

export type UnderSelectInfo =
  | UnderSelectAllowedInfo
  | UnderSelectDisallowedInfo;

export type UnderSelectInfoResponse =
  | CommonSuccessResponse<UnderSelectInfo>
  | CommonFailedResponse<
      | ActionFailType.NotInitialized
      | ActionFailType.MissingCommentary
      | ActionFailType.Unknown
    >;

const COURSE_OFFICES_REGEXP =
  /<select id='kkyxdm' name='kkyxdm'.*?><option value=''>\(请选择\)<\/option>(.*?)<\/select>/;
const COURSE_OFFICE_ITEM_REGEXP = /<option value='(.+?)' >\d+-(.*?)<\/option>/g;
const AREAS_REGEXP =
  /<select id='xqdm' name='xqdm'.*?><option value=''>\(请选择\)<\/option>(.*?)<\/select>/;
const AREA_ITEM_REGEXP = /<option value='(.+?)' >\d+-(.*?)<\/option>/g;
const COURSE_TYPES_REGEXP =
  /<select id='kcdldm' name='kcdldm'.*?><option value=''>\(请选择\)<\/option>(.*?)<\/select>/;
const COURSE_TYPE_ITEM_REGEXP = /<option value='(.+?)' >(.*?)<\/option>/g;
const CURRENT_GRADE_REGEXP = /<option value='(\d+)' selected>\1<\/option>/;
const MAJORS_REGEXP =
  /<select id='zydm' name='zydm'.*?><option value=''>\(全部\)<\/option>(.*?)<\/select>/;
const MAJOR_ITEM_REGEXP =
  /<option value='(\d+?)' (?:selected)?>\d+-(.*?)<\/option>/g;
const CURRENT_MAJOR_REGEXP =
  /<option value='(\d{6,7})' selected>\d+-(.*?)<\/option>/g;
const INFO_TITLE_REGEXP =
  /<span id="title">(.*?)学期&nbsp;&nbsp;(.*?)&nbsp;&nbsp;(?:<span.*?>(.*?)<\/span>)?<\/span>/;
const ALLOWED_INFO_REGEXP =
  /<span id="sub-title">\s+?<div id="text">现在是(.*?)时间\s+（(\d\d:\d\d:\d\d)--(\d\d:\d\d:\d\d)）<\/span>/;

const getSelectInfo = (content: string): UnderSelectInfo => {
  const [, term, name, canCancelText = ""] = INFO_TITLE_REGEXP.exec(content)!;

  const canSelect = !content.includes("现在不是选课时间");

  const currentArea = name.includes("本部")
    ? "本部"
    : name.includes("净月")
      ? "净月"
      : "";
  const currentGrade = Number(CURRENT_GRADE_REGEXP.exec(content)![1]);
  const currentMajor = content.match(CURRENT_MAJOR_REGEXP)![1];

  const currentYear = new Date().getFullYear();
  const grades = Array(6)
    .fill(null)
    .map((_, i) => currentYear - i);

  const areaText = AREAS_REGEXP.exec(content)![1];

  const areas = Array.from(areaText.matchAll(AREA_ITEM_REGEXP)).map(
    ([, value, name]) => ({
      value,
      name,
    }),
  );

  const courseTypeText = COURSE_TYPES_REGEXP.exec(content)![1];

  const types = Array.from(
    courseTypeText.matchAll(COURSE_TYPE_ITEM_REGEXP),
  ).map(([, value, name]) => ({
    value,
    name,
  }));

  const courseOfficeText = COURSE_OFFICES_REGEXP.exec(content)![1];

  const offices = Array.from(
    courseOfficeText.matchAll(COURSE_OFFICE_ITEM_REGEXP),
  ).map(([, value, name]) => ({
    value,
    name,
  }));

  const majorText = MAJORS_REGEXP.exec(content)![2];

  const majors = Array.from(majorText.matchAll(MAJOR_ITEM_REGEXP)).map(
    ([, value, name]) => ({
      value,
      name,
    }),
  );

  const currentMajorConfig = majors.find(
    (major) => major.name === currentMajor,
  )!;

  const state = {
    term,
    name,
    canSelect,
    grades,
    majors: [currentMajorConfig, ...majors],
    areas,
    offices,
    types,
    categories: [
      { name: "专业系列课", value: "3" },
      { name: "思想政治教育", value: "4" },
      { name: "共通教育课程（必修）", value: "5" },
      { name: "学科教育课程（必修）", value: "9" },
      { name: "教育实践课程", value: "10" },
      { name: "学科基础课", value: "11" },
      { name: "数学与逻辑", value: "15" },
      { name: "人文与艺术", value: "16" },
      { name: "体育与国防教育", value: "22" },
      { name: "交流表达与信息素养", value: "24" },
      { name: "发展方向课", value: "25" },
      { name: "专业教育系列课程", value: "31" },
      { name: "共通教育及学科教育选修课程", value: "32" },
      { name: "实践与毕业论文", value: "33" },
      { name: "学院自设通识课", value: "34" },
      { name: "思想政治与社会科学", value: "35" },
      { name: "社会与行为科学", value: "39" },
      { name: "专业主干课", value: "41" },
      { name: "综合实践课程", value: "42" },
      { name: "自然科学", value: "45" },
    ],

    currentArea,
    currentGrade,
    currentMajor,
  };

  if (canSelect) {
    const [, stage, startTime, endTime] = ALLOWED_INFO_REGEXP.exec(content)!;

    return {
      canCancel: canCancelText === "可退选",
      stage,
      startTime,
      endTime,

      ...state,
    };
  }

  return {
    ...state,
    canSelect,
  };
};

const checkCourseCommentary = async (
  term: string,
): Promise<{ completed: boolean; msg: string }> => {
  const { data: content, status } = await request<string>(
    `${CHECK_URL}?xnxqdm=${term}&_=${Date.now()}`,
  );

  if (status !== 200) throw new Error("评教检查失败");

  try {
    if (content.includes("评价已完成")) {
      return { completed: true, msg: "已完成评教" };
    }

    if (content.includes("下次可检查时间为：")) {
      const time = /\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.exec(content)?.[0];

      return { completed: false, msg: `检查过于频繁，请于 ${time} 后重试` };
    }

    if (content.includes("评价未完成")) {
      return { completed: false, msg: "未完成评教" };
    }

    console.debug(content);

    return {
      completed: false,
      msg: "请检查是否完成评教",
    };
  } catch (err) {
    console.error(err);

    throw new Error("评教检查失败");
  }
};

const getUnderSelectInfoLocal = async (
  link: string,
): Promise<UnderSelectInfoResponse> => {
  try {
    const categoryUrl = `${UNDER_STUDY_SERVER}${link}`;

    let { data: content } = await request<string>(categoryUrl, {
      headers: {
        // eslint-disable-next-line @typescript-eslint/naming-convention
        "Cache-Control": "max-age=0",
      },
    });

    if (/<title>.*?评教检查<\/title>/.exec(content)) {
      const { completed } = await checkCourseCommentary(
        /xnxqdm=(\d+)'/.exec(content)![1],
      );

      if (!completed) {
        return {
          success: false,
          msg: "未完成评教",
          type: ActionFailType.MissingCommentary,
        };
      }

      // 重新请求选课信息
      content = (
        await request<string>(categoryUrl, {
          headers: {
            // eslint-disable-next-line @typescript-eslint/naming-convention
            "Cache-Control": "max-age=0",
          },
        })
      ).data;
    }

    if (content.includes("选课正在初始化")) {
      return {
        success: false,
        msg: "选课正在初始化，请稍后再试",
        type: ActionFailType.NotInitialized,
      };
    }

    return {
      success: true,
      data: getSelectInfo(content),
    };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    };
  }
};

const getUnderSelectInfoOnline = async (
  link: string,
): Promise<UnderSelectInfoResponse> =>
  request<UnderSelectInfoResponse>("/under-study/select/info", {
    method: "POST",
    body: { link },
    cookieScope: UNDER_STUDY_SERVER,
  }).then(({ data }) => data);

export const getUnderSelectInfo = withUnderStudyLogin(
  createService(
    "under-select-info",
    getUnderSelectInfoLocal,
    getUnderSelectInfoOnline,
  ),
);

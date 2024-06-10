import type { RichTextNode } from "@mptool/all";
import { getRichTextNodes } from "@mptool/all";

import type { CommonFailedResponse } from "../../../typings/index.js";
import { request } from "../../api/index.js";
import { createService } from "../utils.js";

const POST_RECOMMEND_PLAN_URL =
  "https://math127.nenu.edu.cn/yjsy/HData/ZSB/ZSJZ2024-TM-1.html";
const schoolInfoRegExp =
  /bXYName\['.*?']="<tr><td colspan=6><a href='(.*?)' target='_blank'>([^<]+) ([^<]+)<\/a><br>联系方式：(\S+?)，(\S+?)，(\S+?)<\/td><\/tr>";/g;

const TABLE_HEADER = `<tr><th>招生专业</th><th>研究方向</th><th>学习方式</th><th>招生类型</th><th>拟接收人数</th><th>备注</th></tr>`;

export interface PostRecommendPlanInfo {
  major: string;
  code: string;
  content: RichTextNode[];
}

export interface PostRecommendSchoolPlan {
  name: string;
  code: string;
  site: string;
  contact: string;
  phone: string;
  mail: string;
  majors: PostRecommendPlanInfo[];
}

export interface PostRecommendSuccessResponse {
  success: true;
  data: PostRecommendSchoolPlan[];
}

export type PostRecommendResponse =
  | PostRecommendSuccessResponse
  | CommonFailedResponse;

const getPostRecommendPlanLocal = async (): Promise<PostRecommendResponse> => {
  try {
    const { data, status } = await request<string>(POST_RECOMMEND_PLAN_URL);

    if (status !== 200) throw new Error("获取推免计划失败");

    const schoolInfo: PostRecommendSchoolPlan[] = await Promise.all(
      Array.from(data.matchAll(schoolInfoRegExp)).map(
        async ([, site, code, name, contact, phone, mail]) => {
          const info: PostRecommendSchoolPlan = {
            name,
            site,
            code,
            contact,
            phone,
            mail,
            majors: [],
          };

          const majorCodes = Array.from(
            data.matchAll(
              new RegExp(`cXYName\\['${name}'\\]\\.push\\('([^']+)'\\)`, "g"),
            ),
          );

          const majorNameRegExp = Array.from(
            data.matchAll(
              new RegExp(`fXYName\\['${name}'\\]\\.push\\('([^']+)'\\)`, "g"),
            ),
          );

          info.majors = await Promise.all(
            majorCodes.map(async ([, code], index) => {
              const [, majorName] = majorNameRegExp[index];

              const lines = Array.from(
                data.matchAll(
                  new RegExp(
                    `dXYName\\['${name}'\\]\\['${code}'\\]\\.push\\('(.*)'\\)`,
                    "g",
                  ),
                ),
              ).map(([, line]) => line.replace(/<\/?center>/g, ""));

              return {
                major: majorName,
                code,
                content: await getRichTextNodes(
                  `<table>${TABLE_HEADER}${lines.join("\n")}</table>`,
                ),
              };
            }),
          );

          return info;
        },
      ),
    );

    return { success: true, data: schoolInfo };
  } catch (err) {
    const { message } = err as Error;

    console.error(err);

    return {
      success: false,
      msg: message,
    } as CommonFailedResponse;
  }
};

const getPostRecommendPlanOnline = (): Promise<PostRecommendResponse> =>
  request<PostRecommendResponse>(`/enroll/post-recommend-plan`, {
    method: "POST",
  }).then(({ data }) => data);

export const getPostRecommendPlan = createService(
  "post-recommend-plan",
  getPostRecommendPlanLocal,
  getPostRecommendPlanOnline,
);

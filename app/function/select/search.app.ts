import type { SearchOptions, SelectSearchResponse } from "./typings.js";
import { request } from "../../api/index.js";
import { LoginFailType } from "../../login/index.js";

export const search = async ({
  server,
  jx0502id,
  grade = "",
  major = "",
  courseType = "",
  courseName = "",
  office = "",
  week = "",
  index = "",
}: SearchOptions): Promise<SelectSearchResponse> => {
  try {
    const { data: rawData } = await request<Record<string, string>[] | string>(
      `${server}xk/SeachKC`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        },
        // Note: kcmc is not URL encoded
        body: Object.entries({
          jx0502id,
          kclbs: courseType,
          kkdws: office,
          njs: grade,
          kcmc: courseName,
          zys: major,
          xq: week,
          jc: index,
        })
          .map(([key, value]) => `${key}=${value}`)
          .join("&"),
      },
    );

    if (typeof rawData === "string")
      return {
        success: false,
        msg: "请重新登录",
        type: LoginFailType.Expired,
      };

    const courses = rawData.map(({ kch, kcmc, kkdw, szklb }) => ({
      id: kch,
      name: kcmc,
      office: kkdw,
      type: szklb,
    }));

    console.log(`Getting ${courses.length} courses`);

    return {
      success: true,
      courses,
    };
  } catch (err) {
    console.error(err);

    return {
      success: false,
      msg: (<Error>err).message,
    };
  }
};

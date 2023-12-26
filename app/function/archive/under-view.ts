import { logger } from "@mptool/all";

import { CommonFailedResponse } from "../../../typings/index.js";
import { cookieStore, request } from "../../api/net.js";
import { LoginFailType } from "../../login/loginFailTypes.js";
import { UNDER_SYSTEM_SERVER } from "../../login/under-system.js";
import { isWebVPNPage } from "../../login/utils.js";
import { getIETimeStamp } from "../../utils/browser.js";

export interface UnderBasicInfo {
  text: string;
  value: string;
}

export interface UnderStudyInfo {
  /** 开始时间 */
  startTime: string;
  /** 结束时间 */
  endTime: string;
  /** 地点 */
  school: string;
  /** 职务 */
  title: string;
  /** 证明人 */
  witness: string;
  /** 备注 */
  remark: string;
}

export interface UnderFamilyInfo {
  /** 姓名 */
  name: string;
  /** 与本人关系 */
  relation: string;
  /** 工作单位 */
  office: string;
  /** 职务 */
  title: string;
  /** 联系电话 */
  phone: string;
  /** 备注 */
  remark: string;
}

export interface UnderStudentArchiveInfo {
  /** 学籍照片 */
  archiveImage: string;
  /** 高考照片 */
  examImage: string;
  /** 基础信息 */
  basic: UnderBasicInfo[];
  /** 学习经历信息 */
  study: UnderStudyInfo[];
  /** 家庭信息 */
  family: UnderFamilyInfo[];
  /** 是否能注册 */
  canRegister: boolean;
  /** 是否已注册 */
  isRegistered: boolean;
  /** 注册路径 */
  path: string;
}

export interface GetUnderStudentArchiveOptions {
  type?: "get";
}

export interface UnderGetStudentArchiveSuccessResponse {
  success: true;
  info: UnderStudentArchiveInfo;
}

export type UnderGetStudentArchiveResponse =
  | UnderGetStudentArchiveSuccessResponse
  | (CommonFailedResponse & { type?: LoginFailType.Expired });

const infoRegExp =
  /<td>(\S+)<\/td>\s+<td colspan="\d">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/g;
const studyRegExp =
  /<td {2}>(\S+)<\/td>\s*<td {2}>(\S+)<\/td>\s*<td\scolspan="4">(\S+)<\/td>\s*<td {2}>(\S+)<\/td>\s*<td\scolspan="2">(\S+)<\/td>\s*<td {2}>(\S+)<\/td>/g;
const familyRegExp =
  /<td {2}>(\S+)<\/td>\s*<td {2}>(\S+)<\/td>\s*<td\scolspan="2">(\S+)<\/td>\s*<td\scolspan="2">(\S+)<\/td>\s*<td\scolspan="3">(\S+)<\/td>\s*<td {2}>(\S+)<\/td/g;
const pathRegExp = /var newwin = window.showModalDialog\("(.+?)"\);/;
const registerButtonRegExp =
  /<input\s+type="button"\s+id="zc"\s+class="button"\s+value="确定注册"\s+onclick="bc\(\)"\/>/;
const isRegisteredRegExp = /您已经提交注册信息/;

const UNDER_STUDENT_ARCHIVE_QUERY_URL = `${UNDER_SYSTEM_SERVER}/xszhxxAction.do?method=addStudentPic_xszc`;

const getStudentArchive = async (
  content: string,
): Promise<UnderStudentArchiveInfo> => {
  const [baseInfo, tableInfo] = content.split("本人学历及社会经历");
  const [studyInfo, familyInfo] = tableInfo.split("家庭成员及主要社会关系");

  const basic = Array.from(baseInfo.matchAll(infoRegExp)).map(
    ([, text, value]) => ({
      text: text.replace(/&nbsp;/g, ""),
      value,
    }),
  );
  const study = Array.from(studyInfo.matchAll(studyRegExp))
    .map(([, startTime, endTime, school, title, witness, remark]) => ({
      startTime: startTime.replace(/&nbsp;/g, ""),
      endTime: endTime.replace(/&nbsp;/g, ""),
      school: school.replace(/&nbsp;/g, " ").trim(),
      title: title.replace(/&nbsp;/g, " ").trim(),
      witness: witness.replace(/&nbsp;/g, " ").trim(),
      remark: remark.replace(/&nbsp;/g, " ").trim(),
    }))
    .filter(
      ({ startTime, endTime, school, title, witness, remark }) =>
        startTime || endTime || school || title || witness || remark,
    );
  const family = Array.from(familyInfo.matchAll(familyRegExp))
    .map(([, name, relation, office, title, phone, remark]) => ({
      name: name.replace(/&nbsp;/g, ""),
      relation: relation.replace(/&nbsp;/g, ""),
      office: office.replace(/&nbsp;/g, " ").trim(),
      title: title.replace(/&nbsp;/g, " ").trim(),
      phone: phone.replace(/&nbsp;/g, " ").trim(),
      remark: remark.replace(/&nbsp;/g, " ").trim(),
    }))
    .filter(
      ({ name, relation, office, title, phone, remark }) =>
        name || relation || office || title || phone || remark,
    );

  const [examImageLink, archiveImageLink] = Array.from(
    content.matchAll(/var url\s*=\s*"(.*)"/g),
  ).map(([, url]) => url);

  const [archiveImage, examImage] = await Promise.all([
    archiveImageLink
      ? request<string>(`${UNDER_SYSTEM_SERVER}${archiveImageLink}`, {
          method: "POST",
        })
          .then(({ data }) => data)
          .catch(() => "")
      : "",
    examImageLink
      ? request<string>(`${UNDER_SYSTEM_SERVER}${examImageLink}`, {
          method: "POST",
        })
          .then(({ data }) => data)
          .catch(() => "")
      : "",
  ]);

  const path = pathRegExp.exec(content)?.[1] || "";

  return {
    basic,
    archiveImage,
    examImage,
    study,
    family,
    path,
    canRegister: registerButtonRegExp.test(content),
    isRegistered: isRegisteredRegExp.test(content),
  };
};

export const getUnderStudentArchive =
  async (): Promise<UnderGetStudentArchiveResponse> => {
    const { data: content } = await request<string>(
      `${UNDER_STUDENT_ARCHIVE_QUERY_URL}&tktime=${getIETimeStamp()}`,
    );

    if (isWebVPNPage(content)) {
      cookieStore.clear();

      return {
        success: false,
        type: LoginFailType.Expired,
        msg: "登录已过期，请重新登录",
      };
    }

    if (content.includes("学生学籍卡片")) {
      const info = await getStudentArchive(content);

      return {
        success: true,
        info,
      };
    }

    return {
      success: false,
      msg: "获取学籍信息失败",
    };
  };

export const useOnlineGetStudentArchive =
  (): Promise<UnderGetStudentArchiveResponse> =>
    request<UnderGetStudentArchiveResponse>("/under-system/student-archive", {
      method: "POST",
      cookieScope: UNDER_SYSTEM_SERVER,
    }).then(({ data }) => {
      if (!data.success) logger.error("获取失败", data.msg);

      return data;
    });

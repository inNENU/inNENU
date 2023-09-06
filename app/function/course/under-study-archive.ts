import { encodeBase64, logger } from "@mptool/all";

import type {
  UnderGetStudentArchiveResponse,
  UnderRegisterStudentArchiveResponse,
  UnderStudentArchiveInfo,
} from "./typings.js";
import { request } from "../../api/net.js";
import { service } from "../../config/info.js";
import { LoginFailType } from "../../login/loginFailTypes.js";
import { UNDER_SYSTEM_SERVER } from "../../login/under-system.js";
import { isWebVPNPage } from "../../login/utils.js";
import { getIETimeStamp } from "../../utils/browser.js";
import { cookieStore } from "../../utils/cookie.js";

const infoRegExp =
  /<td>(\S+)<\/td>\s+<td colspan="\d">(?:&nbsp;)*(.*?)(?:&nbsp;)*<\/td>/g;
const studyRegExp =
  /<td {2}>(\S+)<\/td>\s*<td {2}>(\S+)<\/td>\s*<td\scolspan="4">(\S+)<\/td>\s*<td {2}>(\S+)<\/td>\s*<td\scolspan="2">(\S+)<\/td>\s*<td {2}>(\S+)<\/td>/g;
const familyRegExp =
  /<td {2}>(\S+)<\/td>\s*<td {2}>(\S+)<\/td>\s*<td\scolspan="2">(\S+)<\/td>\s*<td\scolspan="2">(\S+)<\/td>\s*<td\scolspan="3">(\S+)<\/td>\s*<td {2}>(\S+)<\/td/g;
const pathRegExp = /var newwin = window.showModalDialog\("(.+?)"\);/;

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

  const id = basic.find(({ text }) => text === "学籍号")!.value;
  const idCard = basic.find(({ text }) => text === "身份证号")!.value;

  const [examImage, archiveImage] = await Promise.all([
    request<ArrayBuffer>(
      `${UNDER_SYSTEM_SERVER}/gkuploadfile/studentphoto/pic/${idCard}.JPG`,
      { responseType: "arraybuffer" },
    )
      .then((examImage) => `data:image/jpeg;base64,${encodeBase64(examImage)}`)
      .catch(() => ""),
    request<ArrayBuffer>(
      `${UNDER_SYSTEM_SERVER}/rxuploadfile/studentphoto/pic/${id}.JPG`,
      { responseType: "arraybuffer" },
    )
      .then(
        (archiveImage) =>
          `data:image/jpeg;base64,${encodeBase64(archiveImage)}`,
      )
      .catch(() => ""),
  ]);

  const path = pathRegExp.exec(content)?.[1] || "";

  return {
    basic,
    archiveImage,
    examImage,
    study,
    family,
    path,
    registered: content.includes("您已经提交注册信息"),
  };
};

export const getUnderStudentArchive =
  async (): Promise<UnderGetStudentArchiveResponse> => {
    const content = await request<string>(
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

const alertRegExp = /window.alert\('(.+?)'\)/;

export const registerStudentArchive = async (
  path: string,
): Promise<UnderRegisterStudentArchiveResponse> => {
  const url = `${UNDER_SYSTEM_SERVER}${path}`;

  const content = await request<string>(url);

  if (isWebVPNPage(content)) {
    cookieStore.clear();

    return {
      success: false,
      type: LoginFailType.Expired,
      msg: "登录已过期，请重新登录",
    };
  }

  const alert = alertRegExp.exec(content)?.[1] || "注册失败";

  if (alert === "注册成功。") return { success: true };

  return {
    success: false,
    msg: alert,
  };
};

export const useOnlineStudentArchive = <T extends string | undefined>(
  path: T,
): Promise<
  T extends string
    ? UnderRegisterStudentArchiveResponse
    : UnderGetStudentArchiveResponse
> =>
  request<
    T extends string
      ? UnderRegisterStudentArchiveResponse
      : UnderGetStudentArchiveResponse
  >(`${service}under-system/student-archive`, {
    method: "POST",
    data: path ? { type: "register", path } : {},
    scope: UNDER_SYSTEM_SERVER,
  }).then((data) => {
    if (!data.success) logger.error("获取失败", data.msg);

    return data;
  });

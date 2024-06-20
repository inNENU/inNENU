import type {
  RawUnderSelectClassItem,
  UnderSelectClassInfo,
  UnderSelectCourseInfo,
} from "./typings";

export const getCourses = (
  records: RawUnderSelectClassItem[],
): UnderSelectCourseInfo[] =>
  records.map(
    ({ kcmc, jc, kcdlmc, kcflmc, kkyxmc, xf, zxs, kcbh, kcptdm }) => ({
      name: kcmc,
      shortType: jc,
      type: kcdlmc,
      category: kcflmc,
      office: kkyxmc,
      point: xf,
      hours: zxs,
      code: kcbh,
      id: kcptdm,
    }),
  );

export const getClasses = (
  records: RawUnderSelectClassItem[],
): UnderSelectClassInfo[] =>
  records.map(
    ({
      kcmc,
      jc,
      kcdlmc,
      kcflmc,
      kkyxmc,
      xf,
      zxs,
      kcbh,
      kcptdm,

      teaxms,
      jxcdmcs,
      jxbmc,
      zcxqjc,
      pkrs,

      jxbdm,
      kcrwdm,
      jxbrs,
    }) => ({
      name: kcmc,
      shortType: jc,
      type: kcdlmc,
      category: kcflmc,
      office: kkyxmc,
      point: xf,
      hours: zxs,
      code: kcbh,
      id: kcptdm,

      teacher: teaxms,
      place: jxcdmcs,
      className: jxbmc,
      time: zcxqjc,
      capacity: pkrs,
      current: Number(jxbrs),

      classCode: jxbdm,
      classId: kcrwdm,
    }),
  );

export interface UnderArchiveFieldInfo {
  name: string;
  value: string;
}

export interface ReadonlyUnderArchiveInfo {
  text: string;
  value: string;
  remark: string;
}

export interface InputUnderArchiveInfo {
  name: string;
  text: string;
  value: string;
  remark: string;
  required: boolean;
}

export interface SingleSelectUnderArchiveInfo {
  name: string;
  text: string;
  defaultValue: string;
  checkboxName: string;
  checkboxValue: string;
  options: { text: string; value: string }[];
  remark: string;
}

export interface MultiSelectUnderArchiveInfo {
  name: string;
  text: string;
  defaultValue: string;
  checkboxName: string;
  checkboxValue: string;
  remark: string;
  category: { text: string; value: string }[];
  values: { text: string; value: string }[][];
}

export interface UnderStudyOptions {
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
}

export interface UnderFamilyOptions {
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
}

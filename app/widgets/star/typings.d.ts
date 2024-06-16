import type {
  OfficialAcademicData,
  OfficialInfoData,
  OfficialNoticeData,
} from "../../pkg/tool/service/index.js";
import type {
  NoticeSuccessResponse,
  NoticeType,
  OfficialInfoType,
} from "../../service/index.js";

export interface StarredOfficialAcademicData extends OfficialAcademicData {
  url: string;
  person: string;
}

export interface StarredOfficialNoticeData extends OfficialNoticeData {
  url: string;
}

export interface StarredOfficialInfoData extends OfficialInfoData {
  url: string;
  type: OfficialInfoType;
}

export interface StarredNoticeData
  extends Omit<NoticeSuccessResponse, "success"> {
  id: string;
  type: NoticeType;
}

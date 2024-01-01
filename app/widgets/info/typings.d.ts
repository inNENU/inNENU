import type { InfoType } from "./api/info.js";
import type { AcademicInfoSuccessResponse } from "../../function/academic/api/getAcademic.js";
import type { AnnouncementInfoSuccessResponse } from "../../function/announcement/api/getAnnouncement.js";
import type { MainInfoSuccessResponse } from "../../function/info/api/getInfo.js";

export interface StarredAcademic
  extends Omit<AcademicInfoSuccessResponse, "success"> {
  url: string;
}

export interface StarredAnnouncement
  extends Omit<AnnouncementInfoSuccessResponse, "success"> {
  url: string;
}

export interface StarredInfo extends Omit<MainInfoSuccessResponse, "success"> {
  url: string;
  type: InfoType;
}

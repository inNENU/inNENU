import type { AcademicInfoSuccessResponse } from "../../service/main/academic.js";
import type { AnnouncementInfoSuccessResponse } from "../../service/main/announcement.js";
import type { InfoType } from "../../service/main/info-list.js";
import type { MainInfoSuccessResponse } from "../../service/main/info.js";

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

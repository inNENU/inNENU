import type {
  AcademicInfoSuccessResponse,
  AnnouncementInfoSuccessResponse,
  InfoType,
  MainInfoSuccessResponse,
} from "../../service/index.js";

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

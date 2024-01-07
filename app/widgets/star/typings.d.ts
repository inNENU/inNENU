import type {
  AcademicInfoSuccessResponse,
  AnnouncementInfoSuccessResponse,
  InfoType,
  MainInfoSuccessResponse,
  NoticeSuccessResponse,
  NoticeType,
} from "../../service/index.js";

export interface StarredAcademic
  extends Omit<AcademicInfoSuccessResponse, "success"> {
  url: string;
  person: string;
}

export interface StarredAnnouncement
  extends Omit<AnnouncementInfoSuccessResponse, "success"> {
  url: string;
}

export interface StarredInfo extends Omit<MainInfoSuccessResponse, "success"> {
  url: string;
  type: InfoType;
}

export interface StarredNotice extends Omit<NoticeSuccessResponse, "success"> {
  id: string;
  type: NoticeType;
}

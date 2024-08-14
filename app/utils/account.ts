import { remove } from "@mptool/all";

import { cookieStore } from "../api/index.js";
import {
  BORROW_BOOKS_KEY,
  CARD_BALANCE_KEY,
  CHANGE_MAJOR_DATA_KEY,
  COURSE_DATA_KEY,
  EMAIL_DATA_KEY,
  EXAM_PLACE_DATA_KEY,
  GRADE_DATA_KEY,
  LICENSE_KEY,
  NEWS_LIST_KEY,
  NOTICE_LIST_KEY,
  SITE_ACADEMIC_LIST_KEY,
  SITE_ANNOUNCEMENT_LIST_KEY,
  SITE_MEDIA_LIST_KEY,
  SITE_NEWS_LIST_KEY,
  SITE_SCIENCE_LIST_KEY,
  SITE_SOCIAL_LIST_KEY,
  SPECIAL_EXAM_DATA_KEY,
  STARRED_ACADEMIC_LIST_KEY,
  STARRED_ANNOUNCEMENT_LIST_KEY,
  STARRED_INFO_LIST_KEY,
  STARRED_NOTICE_LIST_KEY,
  STUDENT_ARCHIVE_KEY,
} from "../config/index.js";
import { mpRemove } from "../service/mp/remove.js";
import { clearUserInfo } from "../state/index.js";

export const logout = (): void => {
  cookieStore.clear();
  clearUserInfo();
  mpRemove();

  // license
  remove(LICENSE_KEY);

  // data
  remove(BORROW_BOOKS_KEY);
  remove(CARD_BALANCE_KEY);
  remove(COURSE_DATA_KEY);
  remove(CHANGE_MAJOR_DATA_KEY);
  remove(EMAIL_DATA_KEY);
  remove(EXAM_PLACE_DATA_KEY);
  remove(GRADE_DATA_KEY);
  remove(NEWS_LIST_KEY);
  remove(NOTICE_LIST_KEY);
  remove(SITE_ACADEMIC_LIST_KEY);
  remove(SITE_ANNOUNCEMENT_LIST_KEY);
  remove(SITE_MEDIA_LIST_KEY);
  remove(SITE_NEWS_LIST_KEY);
  remove(SITE_SCIENCE_LIST_KEY);
  remove(SITE_SOCIAL_LIST_KEY);
  remove(SITE_ANNOUNCEMENT_LIST_KEY);
  remove(SPECIAL_EXAM_DATA_KEY);
  remove(STARRED_ACADEMIC_LIST_KEY);
  remove(STARRED_ANNOUNCEMENT_LIST_KEY);
  remove(STARRED_INFO_LIST_KEY);
  remove(STARRED_NOTICE_LIST_KEY);
  remove(STUDENT_ARCHIVE_KEY);
};

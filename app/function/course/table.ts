import { $Page } from "@mptool/enhance";
import { get, set } from "@mptool/file";

import { type ClassItem, type TableItem, getCourseTable } from "./api.js";
import { modal } from "../../utils/api.js";
import { type AccountBasicInfo } from "../../utils/app.js";
import { appCoverPrefix } from "../../utils/config.js";
import { MONTH } from "../../utils/constant.js";
import { popNotice } from "../../utils/page.js";

const PAGE_ID = "course-table";
const PAGE_TITLE = "课程表";

const getCurrentTime = (): string => {
  const date = new Date();

  const year = date.getFullYear();
  const month = date.getMonth() + 1;

  if (month > 6) return `${year}-${year + 1}-0`;

  return `${year - 1}-${year}-1`;
};

$Page(PAGE_ID, {
  data: {
    courseTable: <TableItem>[],
  },

  onShow() {
    const courseTable = get<TableItem>("course-table");

    if (courseTable) this.setData({ courseTable });
    else {
      const accountInfo = get<AccountBasicInfo>("account-info");

      if (accountInfo)
        void getCourseTable({ ...accountInfo, time: getCurrentTime() }).then(
          (res) => {
            if (res.status === "success") {
              this.setData({ courseTable: res.data });
              set("course-table", res.data, MONTH);
            } else modal("获取失败", res.msg);
          }
        );
      else {
        modal("请先登录", "暂无账号信息，请输入", (): void => {
          this.$go("account?update=true");
        });
      }

      popNotice(PAGE_ID);
    }
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/course/table",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  showClassInfo({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    {
      row: number;
      column: number;
      cell: number;
      class: ClassItem;
    }
  >) {
    const { class: classInfo } = currentTarget.dataset;

    const { name, teacher, time, location } = classInfo;

    modal(name, `${time}\n教师: ${teacher}\n${location}`);
  },
});

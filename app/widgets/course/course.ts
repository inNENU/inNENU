import type { PropType } from "@mptool/all";
import { $Component, get, showModal } from "@mptool/all";

import { COURSE_DATA_KEY } from "../../config/index.js";
import type {
  CourseTableClassData,
  CourseTableData,
  CourseTableInfo,
} from "../../typings/index.js";
import {
  getCurrentTimeCode,
  getWeekIndex,
  getWeekName,
} from "../../utils/index.js";
import { getSize } from "../utils.js";

$Component({
  props: {
    type: {
      type: String as PropType<
        "今日课程 (小)" | "下节课程 (小)" | "今日课程" | "课程表 (大)"
      >,
      default: "今日课程",
    },
  },

  data: {
    maxWeek: 0,
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData({ size: getSize(type) });
      this.init();
    },
  },

  pageLifetimes: {
    show() {
      this.init();
    },
  },

  methods: {
    init() {
      const { type } = this.data;
      const coursesData = get<Record<string, CourseTableInfo>>(COURSE_DATA_KEY);
      const time = getCurrentTimeCode();

      if (!coursesData?.[time]) {
        this.setData({ missing: true });

        return;
      }

      const { table, maxWeek, startTime } = coursesData[time];
      const weekIndex = getWeekIndex(startTime, maxWeek);

      this.setData({ maxWeek });

      if (type.includes("今日课程")) {
        this.setTodayCourses(table, weekIndex);

        return;
      }
      if (type.includes("下节课程")) {
        this.setNextCourse(table, weekIndex, maxWeek);

        return;
      }
      if (type.includes("课程表")) {
        this.setCourses(table, weekIndex);

        return;
      }
    },

    setCourses(tableData: CourseTableData, weekIndex: number) {
      const table = tableData.map((row) =>
        row.map((cell) =>
          cell
            .filter((course) => course.weeks.includes(weekIndex))
            .map((course) => ({
              ...course,
              location: course.locations[course.weeks.indexOf(weekIndex)],
            })),
        ),
      );

      this.setData({
        table,
        empty: table.every((row) => row.every((cell) => !cell.length)),
        missing: false,
      });
    },

    setTodayCourses(table: CourseTableData, weekIndex: number) {
      const now = new Date();
      const isTomorrow = now.getHours() >= 21;
      const day = isTomorrow ? (now.getDay() + 1) % 7 : now.getDay();
      const dayIndex = day === 0 ? 6 : day - 1;

      const todayCourses = table.map((row) =>
        row[dayIndex]
          .filter((course) => course.weeks.includes(weekIndex))
          .map((course) => ({
            ...course,
            location: course.locations[course.weeks.indexOf(weekIndex)],
          })),
      );

      if (todayCourses.some((item) => item.length))
        this.setData({
          isTomorrow,
          todayCourses,
          empty: false,
          missing: false,
        });
      else this.setData({ isTomorrow, empty: true, missing: false });
    },

    setNextCourse(
      table: CourseTableData,
      currentWeekIndex: number,
      maxWeek: number,
    ) {
      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      const isTomorrow = hours >= 20 || (hours === 19 && minutes >= 30);

      const day = now.getDay();
      let weekIndex = currentWeekIndex;
      const currentDayIndex = day === 0 ? 6 : day - 1;
      let dayIndex = isTomorrow ? (currentDayIndex + 1) % 7 : currentDayIndex;
      let classIndex = isTomorrow
        ? 0
        : hours >= 18 || (hours === 17 && minutes >= 30)
          ? 5
          : hours >= 16 || (hours === 15 && minutes >= 30)
            ? 4
            : hours >= 14 || (hours === 13 && minutes >= 30)
              ? 3
              : hours >= 10
                ? 2
                : hours >= 8
                  ? 1
                  : 0;
      let nextCourses: CourseTableClassData[] = [];

      if (!table.length) {
        this.setData({ missing: true });

        return;
      }

      while (true) {
        const currentCell = table[classIndex][dayIndex].filter((course) =>
          course.weeks.includes(weekIndex),
        );

        if (currentCell.length) {
          nextCourses = currentCell;

          break;
        }

        if (classIndex === 5) {
          if (dayIndex === 6) {
            if (weekIndex === maxWeek) {
              this.setData({ isTomorrow, empty: true });

              return;
            }

            classIndex = 0;
            dayIndex = 0;
            weekIndex++;
            continue;
          }

          classIndex = 0;
          dayIndex++;
          continue;
        }

        classIndex++;
      }

      const time = `${
        currentDayIndex === dayIndex
          ? "今天"
          : (currentDayIndex + 1) % 7 === dayIndex
            ? "明天"
            : (currentDayIndex + 2) % 7 === dayIndex
              ? "后天"
              : `${
                  currentWeekIndex === weekIndex
                    ? ""
                    : new Array(weekIndex - currentWeekIndex).fill("下").join()
                }${
                  ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][
                    dayIndex
                  ]
                }`
      }${["8:00", "10:00", "13:30", "15:30", "17:30", "19:30"][classIndex]}`;

      this.setData({
        time,
        nextCourses,
        empty: false,
        missing: false,
      });
    },

    courseTable() {
      this.$go("under-course-table");
    },

    showClassInfo({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<never, never>,
      Record<never, never>,
      {
        info: CourseTableClassData & { location: string };
      }
    >) {
      const { maxWeek } = this.data;
      const { name, teachers, location, weeks, classIndex, time } =
        currentTarget.dataset.info;

      showModal(
        name,
        `教师: ${teachers.join("，")}\n地点: ${location}\n节次:${classIndex[0]}-${classIndex[1]}节\n时间: ${getWeekName(weeks, maxWeek)} ${time}`,
      );
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

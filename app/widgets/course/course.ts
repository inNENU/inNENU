import { $Component, PropType, get } from "@mptool/all";

import type { ClassData, CourseTableData, TableData } from "./typings.js";
import { getCurrentTime, getWeekIndex } from "./utils.js";
import { showModal } from "../../api/index.js";
import { COURSE_DATA_KEY } from "../../config/index.js";
import { getSize } from "../utils.js";

$Component({
  properties: {
    type: {
      type: String as PropType<
        "今日课程 (小)" | "下节课程 (小)" | "今日课程" | "课程表 (大)"
      >,
      default: "今日课程",
    },
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
      const coursesData = get<Record<string, CourseTableData>>(COURSE_DATA_KEY);
      const time = getCurrentTime();

      if (coursesData && coursesData[time]) {
        const { courseData, weeks, startTime } = coursesData[time];
        const weekIndex = getWeekIndex(startTime, weeks);

        if (type.includes("今日课程"))
          this.setTodayCourses(courseData, weekIndex);
        else if (type.includes("下节课程"))
          this.setNextCourse(courseData, weekIndex, weeks);
        else if (type.includes("课程表"))
          this.setCourses(courseData, weekIndex);
      } else {
        this.setData({ missing: true });
      }
    },

    setCourses(courseData: TableData, weekIndex: number) {
      this.setData({
        courseData: courseData.map((row) =>
          row.map((cell) =>
            cell.filter((course) =>
              course.weeks.some(
                ([start, end]) => weekIndex >= start && weekIndex <= end,
              ),
            ),
          ),
        ),
        missing: false,
      });
    },

    setTodayCourses(courseData: TableData, weekIndex: number) {
      const now = new Date();
      const isTomorrow = now.getHours() >= 21;
      const day = isTomorrow ? (now.getDay() + 1) % 7 : now.getDay();
      const dayIndex = day === 0 ? 6 : day - 1;

      const todayCourses = courseData.map((row) =>
        row[dayIndex].filter((course) =>
          course.weeks.some(
            ([start, end]) => weekIndex >= start && weekIndex <= end,
          ),
        ),
      );

      if (todayCourses.some((item) => item.length))
        this.setData({ isTomorrow, todayCourses, missing: false });
      else this.setData({ isTomorrow, empty: true, missing: false });
    },

    setNextCourse(
      courseData: TableData,
      currentWeekIndex: number,
      maxWeeks: number,
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
      let nextCourses: ClassData[] = [];

      // eslint-disable-next-line no-constant-condition
      while (true) {
        const currentCell = courseData[classIndex][dayIndex].filter((course) =>
          course.weeks.some(
            ([start, end]) => weekIndex >= start && weekIndex <= end,
          ),
        );

        if (currentCell.length) {
          nextCourses = currentCell;

          break;
        }

        if (classIndex === 5) {
          if (dayIndex === 6) {
            if (weekIndex === maxWeeks)
              return this.setData({ isTomorrow, empty: true });

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
        missing: false,
      });
    },

    courseTable() {
      this.$go("course-table");
    },

    showClassInfo({
      currentTarget,
    }: WechatMiniprogram.TouchEvent<
      Record<never, never>,
      Record<never, never>,
      {
        info: ClassData;
      }
    >) {
      const { name, teacher, location, time } = currentTarget.dataset.info;

      showModal(name, `教师: ${teacher}\n地点: ${location}\n时间: ${time}`);
    },
  },

  externalClasses: ["wrapper-class"],

  options: {
    virtualHost: true,
  },
});

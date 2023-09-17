import { $Component, PropType, get } from "@mptool/all";

import type { ClassData, CourseTableData, TableData } from "./typings.js";
import { getCurrentTime, getWeekIndex } from "./utils.js";
import { showModal } from "../../api/index.js";
import { COURSE_DATA_KEY } from "../../config/index.js";

$Component({
  properties: {
    type: {
      type: String as PropType<
        "今日课程" | "下节课程" | "课程表" | "完整今日课程"
      >,
      default: "今日课程",
    },
  },

  lifetimes: {
    attached() {
      const { type } = this.data;

      this.setData({
        size:
          "完整今日课程" === type
            ? "medium"
            : type === "课程表"
            ? "large"
            : "small",
      });
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
        else if (type === "下节课程")
          this.setNextCourse(courseData, weekIndex, weeks);
        else if (type === "课程表") this.setCourses(courseData, weekIndex);
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
      });
    },

    setTodayCourses(courseData: TableData, weekIndex: number) {
      const now = new Date();
      const isTomorrow = now.getHours() >= 21;
      const day = isTomorrow ? now.getDay() + 1 : now.getDay();
      const dayIndex = day === 0 ? 6 : day - 1;

      const todayCourses = courseData.map((row) =>
        row[dayIndex].filter((course) =>
          course.weeks.some(
            ([start, end]) => weekIndex >= start && weekIndex <= end,
          ),
        ),
      );

      if (todayCourses.some((item) => item.length))
        this.setData({
          isTomorrow,
          todayCourses,
        });
      else this.setData({ isTomorrow, empty: true });
    },

    setNextCourse(
      courseData: TableData,
      currentWeekIndex: number,
      maxWeeks: number,
    ) {
      const now = new Date();
      const isTomorrow =
        now.getHours() >= 20 ||
        (now.getHours() === 19 && now.getMinutes() >= 30);

      const day = isTomorrow ? now.getDay() + 1 : now.getDay();
      let weekIndex = currentWeekIndex;
      const currentDayIndex = day === 0 ? 6 : day - 1;
      let dayIndex = currentDayIndex;
      let classIndex = isTomorrow
        ? 0
        : now.getHours() >= 18 ||
          (now.getHours() === 17 && now.getMinutes() >= 30)
        ? 5
        : now.getHours() >= 16 ||
          (now.getHours() === 15 && now.getMinutes() >= 30)
        ? 4
        : now.getHours() >= 14 ||
          (now.getHours() === 13 && now.getMinutes() >= 30)
        ? 3
        : now.getHours() >= 10
        ? 2
        : now.getHours() >= 8
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
              ["周一", "周二", "周三", "周四", "周五", "周六", "周日"][dayIndex]
            }`
      }${["8:00", "10:00", "13:30", "15:30", "17:30", "19:00"][classIndex]}`;

      this.setData({
        time,
        nextCourses,
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

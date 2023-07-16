import { $Component, get } from "@mptool/all";

import { type CourseTableData } from "./typings.js";
import { getCurrentTime, getWeekIndex } from "./utils.js";
import { COURSE_DATA_KEY } from "../../config/index.js";

$Component({
  data: {},

  lifetimes: {
    attached() {
      this.setTodayCourses();
    },
  },

  pageLifetimes: {
    show() {
      this.setTodayCourses();
    },
  },

  methods: {
    setTodayCourses() {
      const coursesData = get<Record<string, CourseTableData>>(COURSE_DATA_KEY);
      const time = getCurrentTime();

      if (coursesData && coursesData[time]) {
        const { courseData, weeks, startTime } = coursesData[time];

        const weekIndex = getWeekIndex(startTime, weeks);
        const day = new Date().getDay();
        const dayIndex = day === 0 ? 6 : day - 1;

        const todayCourses = courseData.map((item) =>
          Array.from(
            new Set(
              item[dayIndex]
                .filter((course) =>
                  course.weeks.some(
                    ([start, end]) => weekIndex >= start && weekIndex <= end,
                  ),
                )
                .map(({ name, location }) => `${name}@${location}`),
            ),
          ),
        );

        if (todayCourses.some((item) => item.length))
          this.setData({ todayCourses, missing: false, empty: false });
        else this.setData({ empty: true, missing: false });
      } else {
        this.setData({ missing: true });
      }
    },

    courseTable() {
      this.$go("course-table");
    },
  },

  externalClasses: ["custom-class"],
});

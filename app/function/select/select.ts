import { $Page } from "@mptool/enhance";
import { get } from "@mptool/file";

import {
  CourseBasicInfo,
  CourseData,
  CourseInfo,
  MajorInfo,
  SearchOptions,
  getAmount,
  getInfo,
  login,
  process,
  search,
} from "./api.js";
import { type AppOption } from "../../app.js";
import { modal, tip } from "../../utils/api.js";
import { type AccountInfo } from "../../utils/app.js";
import { getColor, popNotice } from "../../utils/page.js";
import { promiseQueue } from "../utils/promiseQueue.js";

const { globalData } = getApp<AppOption>();

interface FullCourseInfo extends CourseInfo {
  amount: number;
}

const PAGE_ID = "select";

$Page(PAGE_ID, {
  data: {
    theme: globalData.theme,

    login: false,
    firstPage: false,

    courseOffices: <string[]>[],
    courseTable: <CourseData[][][]>[],
    courseTypes: <string[]>[],
    courses: <CourseBasicInfo[]>[],
    grades: <string[]>[],
    majors: <MajorInfo[]>[],

    courseName: "",
    classIndex: 0,
    courseTypeIndex: 0,
    officeIndex: 0,
    gradeIndex: 0,
    majorIndex: 0,
    weekIndex: 0,

    courseInfo: <FullCourseInfo | null>null,
    courseInfoPopupConfig: {
      title: "课程",
      subtitle: "课程详情",
      confirm: false,
      cancel: false,
    },
    relatedCourses: <FullCourseInfo[]>[],

    coursesDetail: <FullCourseInfo[]>[],
    courseDetailPopupConfig: {
      title: "课程列表",
      subtitle: "点击课程来选课",
      confirm: false,
      cancel: false,
    },
  },

  state: {
    accountInfo: null as AccountInfo | null,
    cookies: <string[]>[],
    courses: [] as CourseInfo[],
    currentGrade: "",
    currentMajor: "",
    jx0502id: "",
    jx0502zbid: "",
    server: "",
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: globalData.theme,
      firstPage: getCurrentPages().length === 1,
    });
  },

  onShow() {
    const accountInfo = get<AccountInfo>("account-info") || null;

    if (accountInfo) {
      this.state.accountInfo = accountInfo;
      login(accountInfo)
        .then((data) => {
          if (data.status === "success") {
            this.state.cookies = data.cookies;
            this.state.server = data.server;
            this.setData({ login: true }, () => {
              this.createSelectorQuery()
                .select(".select-container")
                .fields({ size: true }, (res) => {
                  if (res) this.setData({ height: res.height as number });
                })
                .exec();
            });

            return this.loadInfo();
          }

          return modal("登录失败", data.msg, (): void => {
            this.$go("account?update=true");
          });
        })
        .then(() =>
          this.search({
            grade: this.state.currentGrade,
            major: this.state.currentMajor,
          })
        )
        .catch(() => {
          modal("初始化失败", "请检查网络连接", (): void => {
            this.$back();
          });
        });
    } else {
      modal("请先登录", "暂无账号信息，请输入", (): void => {
        this.$go("account?update=true");
      });
    }

    popNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  inputCourseName({ detail }: WechatMiniprogram.Input) {
    this.setData({ courseName: detail.value });
  },

  pickerChange({
    target,
    detail,
  }: WechatMiniprogram.PickerChange<Record<never, never>, { key: string }>) {
    this.setData({ [target.dataset.key]: detail.value });
  },

  showCourseInfo({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { cid: string }
  >) {
    const { cid } = currentTarget.dataset;

    const course: CourseInfo | undefined = this.state.courses.find(
      (item) => item.cid === cid
    );

    if (course) {
      this.getAmount(course.id).then((data) => {
        if (data.status === "success") {
          const courseInfo = {
            ...course,
            amount: data.data.find((item) => item.cid === course.cid)!.amount,
          };
          const relatedCourses = data.data
            .map(({ cid, amount }) => {
              const course = this.state.courses.find(
                (item) => item.cid === cid
              );

              if (course) return { ...course, amount };

              console.error("未找到匹配课程", cid);

              return null;
            })
            .filter(
              (item): item is CourseInfo & { amount: number } =>
                item !== null && item.cid !== course.cid
            );

          this.setData({
            courseInfo,
            relatedCourses,
          });
        } else {
          modal("获取课程信息失败", data.msg);
        }
      });
    } else {
      modal("未找到匹配课程", "请汇报给开发者!");
    }
  },

  searchCourses() {
    const {
      courseTypes,
      courseOffices,
      grades,
      majors,

      courseName,
      classIndex,
      courseTypeIndex,
      officeIndex,
      gradeIndex,
      majorIndex,
      weekIndex,
    } = this.data;
    const options: Omit<SearchOptions, "cookies" | "server" | "jx0502id"> = {};

    if (courseName) options.courseName = courseName;
    if (classIndex) options.index = classIndex - 1;
    if (courseTypeIndex) options.courseType = courseTypes[courseTypeIndex - 1];
    if (officeIndex) options.office = courseOffices[officeIndex - 1];
    if (gradeIndex) options.grade = grades[gradeIndex - 1];
    if (majorIndex) options.major = majors[majorIndex - 1].id;
    if (weekIndex)
      options.week = ["0102", "0304", "0506", "0708", "0910", "1112"][
        weekIndex - 1
      ];

    wx.showLoading({ title: "搜索中" });

    this.search(options).then(() => wx.hideLoading());
  },

  showCourseDetail({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { id: string }
  >) {
    const { id } = currentTarget.dataset;

    wx.showLoading({ title: "获取人数" });

    return this.getAmount(id).then((res) => {
      wx.hideLoading();
      if (res.status === "success") {
        this.setData({
          coursesDetail: res.data
            .map(({ cid, amount }) => {
              const course = this.state.courses.find(
                (item) => item.cid === cid
              );

              if (course) return { ...course, amount };

              console.error("未找到匹配课程", cid);

              return null;
            })
            .filter((item): item is FullCourseInfo => item !== null),
        });
      } else {
        modal("获取人数失败", res.msg);
      }
    });
  },

  closeInfoPopup() {
    this.setData({
      courseInfo: null,
      relatedCourses: [],
    });
  },

  closeDetailPopup() {
    this.setData({ coursesDetail: [] });
  },

  loadInfo() {
    return getInfo({
      cookies: this.state.cookies,
      server: this.state.server,
    }).then((res) => {
      if (res.status === "success") {
        const {
          courseOffices,
          courseTable,
          courseTypes,
          courses,
          currentGrade,
          currentMajor,
          grades,
          majors,
          jx0502id,
          jx0502zbid,
        } = res;

        this.state = {
          ...this.state,
          currentGrade,
          currentMajor,
          jx0502id,
          jx0502zbid,
          courses,
        };

        this.setData({
          courseOffices,
          courseTable,
          courseTypes,
          grades,
          gradeIndex: grades.findIndex((item) => item === currentGrade) + 1,
          majors,
          majorIndex: majors.findIndex((item) => item.id === currentMajor) + 1,
        });
      }
    });
  },

  getAmount(id: string) {
    return getAmount({
      cookies: this.state.cookies,
      server: this.state.server,
      jx0502id: this.state.jx0502id,
      id,
    });
  },

  search(options: Omit<SearchOptions, "cookies" | "server" | "jx0502id">) {
    return search({
      cookies: this.state.cookies,
      server: this.state.server,
      jx0502id: this.state.jx0502id,
      ...options,
    }).then((res) => {
      if (res.status === "success") this.setData({ courses: res.courses });
      else modal("查询失败", res.msg);
    });
  },

  select(cid: string) {
    return new Promise((resolve) => {
      modal(
        "选课确认",
        "您确认选择此课程?",
        () => {
          resolve(
            process("add", {
              cookies: this.state.cookies,
              id: cid,
              server: this.state.server,
              jx0502id: this.state.jx0502id,
              jx0502zbid: this.state.jx0502zbid,
            }).then((res) => {
              if (res.status === "success") {
                tip("选课成功", 1000, "success");
                this.setData({
                  coursesDetail: [],
                });
                this.loadInfo();
              } else {
                modal("选课失败", res.msg);
              }

              return res.status === "success";
            })
          );
        },
        () => {
          resolve(false);
        }
      );
    });
  },

  selectCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { cid: string }
  >) {
    const { cid } = currentTarget.dataset;

    return this.select(cid);
  },

  doSelectCourse(cid: string, times = 100) {
    // eslint-disable-next-line prefer-const
    let stop: () => void;

    const queue = Array<() => Promise<void>>(times).fill(() =>
      this.select(cid).then((success) => {
        if (success) stop();
      })
    );

    const selectQueue = promiseQueue(queue);

    stop = selectQueue.stop;

    return selectQueue.run();
  },

  forceSelectCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { cid: string }
  >) {
    const times = 100;
    const { cid } = currentTarget.dataset;

    modal("连续选课", "您确认连续选课?", () => {
      wx.showLoading({ title: "选课中" });
      let completeTime = 0;

      const requestForceSelect = (): void => {
        modal(
          "操作完成",
          `您已连续选课${completeTime * times}次，是否继续?`,
          () => {
            this.doSelectCourse(cid, times).then(() => {
              wx.hideLoading();
              completeTime += 1;
              requestForceSelect();
            });
          }
        );
      };

      this.doSelectCourse(cid, times).then(() => {
        completeTime += 1;
        wx.hideLoading();

        requestForceSelect();
      });
    });
  },
});

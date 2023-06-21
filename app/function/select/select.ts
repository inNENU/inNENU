import { $Page, logger } from "@mptool/enhance";
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
import { confirmReplace } from "./utils.js";
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
      confirm: "刷新人数",
      cancel: false,
    },
    relatedCourses: <FullCourseInfo[]>[],

    coursesDetail: <FullCourseInfo[]>[],
    courseDetailPopupConfig: {
      title: "课程列表",
      subtitle: "点击课程来选课",
      confirm: "刷新人数",
      cancel: false,
    },
  },

  state: {
    accountInfo: null as AccountInfo | null,
    currentCourseId: "",
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

            wx.showLoading({ title: "获取信息" });

            return this.loadInfo()
              .then(() =>
                this.search({
                  grade: this.state.currentGrade,
                  major: this.state.currentMajor,
                })
              )
              .then(() => {
                wx.hideLoading();
              })
              .catch(() => {
                wx.hideLoading();
                tip("获取信息失败");
              });
          }

          return modal("登录失败", data.msg, (): void => {
            this.$go("account?update=true");
          });
        })
        .catch(() => {
          modal(
            "初始化失败",
            "请检查: 是否在选课时间、网络连接是否有效",
            (): void => {
              this.$back();
            }
          );
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
    this.setData({ [target.dataset.key]: Number(detail.value) });
  },

  showCourseInfo({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { cid: string }
  >) {
    wx.showLoading({ title: "获取人数" });

    const { cid } = currentTarget.dataset;
    const { courses } = this.state;

    const course: CourseInfo | undefined = courses.find(
      (item) => item.cid === cid
    );

    if (course) {
      this.getAmount(course.id).then((data) => {
        wx.hideLoading();
        if (data.status === "success") {
          const courseInfo = {
            ...course,
            amount: data.data.find((item) => item.cid === course.cid)!.amount,
          };
          const relatedCourses = data.data
            .map(({ cid, amount }) => {
              const course = courses.find((item) => item.cid === cid);

              if (course) return { ...course, amount };

              logger.error("未找到匹配课程", cid);

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
          modal("获取课程人数失败", data.msg);
        }
      });
    } else {
      modal("未找到课程信息", "暂无所选课程数据，请汇报给开发者!");
    }
  },

  refreshInfoAmount() {
    const { courseInfo } = this.data;
    const { courses } = this.state;

    this.getAmount(courseInfo!.id).then((data) => {
      if (data.status === "success") {
        const course = {
          ...courseInfo,
          amount: data.data.find((item) => item.cid === courseInfo!.cid)!
            .amount,
        };
        const relatedCourses = data.data
          .map(({ cid, amount }) => {
            const course = courses.find((item) => item.cid === cid);

            if (course) return { ...course, amount };

            logger.error("未找到匹配课程", cid);

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
        modal("获取课程人数失败", data.msg);
      }
    });
  },

  closeInfoPopup() {
    this.setData({ courseInfo: null, relatedCourses: [] });
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
        const { courses } = this.state;

        this.state.currentCourseId = id;
        this.setData({
          coursesDetail: res.data
            .map(({ cid, amount }) => {
              const course = courses.find((item) => item.cid === cid);

              if (course) return { ...course, amount };

              logger.error("未找到匹配课程", cid);

              return null;
            })
            .filter((item): item is FullCourseInfo => item !== null),
        });
      } else {
        modal("获取人数失败", res.msg);
      }
    });
  },

  refreshDetailAmount() {
    const { currentCourseId } = this.state;

    wx.showLoading({ title: "刷新人数" });

    return this.getAmount(currentCourseId).then((res) => {
      wx.hideLoading();
      if (res.status === "success") {
        const { courses } = this.state;

        this.setData({
          coursesDetail: res.data
            .map(({ cid, amount }) => {
              const course = courses.find((item) => item.cid === cid);

              if (course) return { ...course, amount };

              logger.error("未找到匹配课程", cid);

              return null;
            })
            .filter((item): item is FullCourseInfo => item !== null),
        });
      } else {
        modal("刷新人数失败", res.msg);
      }
    });
  },

  closeDetailPopup() {
    this.state.currentCourseId = "";
    this.setData({ coursesDetail: [] });
  },

  selectCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { cid: string }
  >) {
    const { cid } = currentTarget.dataset;

    return new Promise((resolve) => {
      modal(
        "选课确认",
        "您确认选择此课程?",
        () =>
          resolve(
            this.process("add", cid).then((res) => {
              if (res.status === "success") {
                tip("选课成功", 1000, "success");
                this.setData({ coursesDetail: [] });
                this.loadInfo();

                return true;
              }

              modal("选课失败", res.msg);

              // 重新进入本页面
              if (res.type === "relogin") this.$redirect("select");

              return false;
            })
          ),
        () => resolve(false)
      );
    });
  },

  unselectCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { cid: string }
  >) {
    const { cid } = currentTarget.dataset;

    return new Promise((resolve) => {
      modal(
        "退课确认",
        "您确认退选此课程?",
        () =>
          resolve(
            this.process("delete", cid).then((res) => {
              if (res.status === "success") {
                tip("退课成功", 1000, "success");
                this.setData({
                  courseInfo: null,
                  relatedCourses: [],
                });
                this.loadInfo();

                return true;
              }

              modal("退课失败", res.msg);

              // 重新进入本页面
              if (res.type === "relogin") this.$redirect("select");

              return false;
            })
          ),
        () => resolve(false)
      );
    });
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

    modal(
      "连续选课",
      "您确认连续选课?",
      () => {
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
            },
            () => {
              // cancel
            }
          );
        };

        this.doSelectCourse(cid, times).then(() => {
          completeTime += 1;
          wx.hideLoading();

          requestForceSelect();
        });
      },
      () => {
        // cancel
      }
    );
  },

  replaceCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { id: string; cid: string; oid: string }
  >) {
    return confirmReplace().then((confirm) => {
      if (confirm) {
        return new Promise((resolve) => {
          modal(
            "确认替换课程",
            "您确认尝试替换已有课程为此课程",
            () => {
              const { id, cid, oid } = currentTarget.dataset;

              const { capacity } = this.state.courses.find(
                (item) => item.cid === cid
              )!;

              resolve(
                this.getAmount(id).then((data) => {
                  if (data.status === "success") {
                    const amount = data.data.find(
                      (item) => item.cid === cid
                    )?.amount;

                    if (
                      typeof amount === "number" &&
                      amount < Number(capacity)
                    ) {
                      wx.showLoading({ title: "退课中" });

                      return this.process("delete", oid)
                        .then((res) => {
                          wx.hideLoading();

                          if (res.status === "success") {
                            wx.showLoading({ title: "选课中" });

                            return this.process("add", cid).then((res) => {
                              wx.hideLoading();
                              if (res.status === "success") {
                                modal("替换课程成功", "您已成功替换课程");

                                return true;
                              }

                              wx.showLoading({ title: "撤销中" });

                              return this.process("add", oid).then((res) => {
                                wx.hideLoading();

                                if (res.status === "success") {
                                  modal(
                                    "替换课程失败",
                                    "由于退课后新课程人数已满，所选课程选课失败。由于原课程人数未满，已成功为您选回原课程。"
                                  );

                                  return false;
                                }

                                modal(
                                  "替换课程失败",
                                  "由于退课后新课程人数已满，且旧课程人数也满，您丢失了此课程。"
                                );

                                return false;
                              });
                            });
                          }

                          modal("退课失败", res.msg);

                          return false;
                        })
                        .then((success) => {
                          this.setData({
                            courseInfo: null,
                            relatedCourses: [],
                          });

                          return this.loadInfo().then(() => success);
                        });
                    }

                    modal("替换失败", "所选课程已满，无法替换操作");

                    return false;
                  }

                  modal("获取人数失败", "无法获取新课程是否已满，取消替换操作");

                  return false;
                })
              );
            },
            () => {
              resolve(false);
            }
          );
        });
      }

      return Promise.resolve(false);
    });
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

  process(type: "add" | "delete", cid: string) {
    return process(type, {
      cookies: this.state.cookies,
      id: cid,
      server: this.state.server,
      jx0502id: this.state.jx0502id,
      jx0502zbid: this.state.jx0502zbid,
    });
  },

  doSelectCourse(cid: string, times = 100) {
    // eslint-disable-next-line prefer-const
    let stop: () => void;

    const queue = Array<() => Promise<void>>(times).fill(() =>
      this.process("add", cid).then(({ status }) => {
        if (status === "success") stop();
      })
    );

    const selectQueue = promiseQueue(queue);

    stop = selectQueue.stop;

    return selectQueue.run();
  },
});

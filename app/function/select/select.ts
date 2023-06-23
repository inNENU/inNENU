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
import {
  type FullCourseInfo,
  type SortKey,
  confirmReplace,
  courseSorter,
} from "./utils.js";
import { type AppOption } from "../../app.js";
import { modal, tip } from "../../utils/api.js";
import { type AccountInfo } from "../../utils/app.js";
import { appCoverPrefix } from "../../utils/config.js";
import { getColor, popNotice } from "../../utils/page.js";
import { promiseQueue } from "../utils/promiseQueue.js";

const { globalData } = getApp<AppOption>();

interface ForceSelectMessage {
  type: "conflict" | "relogin" | "forbid" | "success";
  msg: string;
}

const PAGE_TITLE = "选课系统";
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

    courseDetailPopupConfig: {
      title: "课程列表",
      confirm: "刷新人数",
      cancel: false,
      bodyClass: "course-detail-popup-body",
    },
    coursesDetail: <FullCourseInfo[]>[],

    sortKeys: <SortKey[]>[
      "className",
      "teacher",
      "spare",
      "amount",
      "capacity",
    ],
    sortKeyIndex: 0,
    ascending: true,
    filterLocation: true,
  },

  state: {
    accountInfo: null as AccountInfo | null,
    cookies: <string[]>[],
    server: "",
    jx0502id: "",
    jx0502zbid: "",

    courses: [] as CourseInfo[],

    currentGrade: "",
    currentLocation: "",
    currentMajor: "",
    selectedCourseIds: <string[]>[],

    currentCourseId: "",
    coursesDetail: <FullCourseInfo[]>[],
    relatedCourses: <FullCourseInfo[]>[],
    isForceSelecting: false,
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
              .then((isSuccess) =>
                isSuccess
                  ? this.search({
                      grade: this.state.currentGrade,
                      major: this.state.currentMajor,
                    })
                  : void 0
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

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: "/function/enroll/info",
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

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
    const { sortKeys, sortKeyIndex, ascending, filterLocation } = this.data;
    const { courses, currentLocation } = this.state;

    const course: CourseInfo | undefined = courses.find(
      (item) => item.cid === cid
    );

    if (course) {
      this.getAmount(course.id).then((data) => {
        wx.hideLoading();
        if (data.status === "success") {
          const courseInfo = {
            ...course,
            isSelected: true,
            amount: data.data.find((item) => item.cid === course.cid)!.amount,
          };
          const relatedCourses = data.data
            .map(({ cid, amount }) => {
              const course = courses.find((item) => item.cid === cid);

              if (course) return { ...course, isSelected: false, amount };

              logger.error("未找到匹配课程", cid);

              return null;
            })
            .filter(
              (item): item is FullCourseInfo =>
                item !== null && item.cid !== course.cid
            );

          this.state.relatedCourses = relatedCourses;

          this.setData({
            courseInfo,
            relatedCourses: relatedCourses
              .filter(
                (item) =>
                  !filterLocation || item.place.includes(currentLocation)
              )
              .sort(courseSorter(sortKeys[sortKeyIndex], ascending)),
          });
        } else {
          modal("获取课程人数失败", data.msg);
          if (data.type === "relogin") this.$redirect(PAGE_ID);
        }
      });
    } else {
      modal("未找到课程信息", "暂无所选课程数据，请汇报给开发者!");
    }
  },

  changeRelatedSorter({ detail }: WechatMiniprogram.PickerChange) {
    const { sortKeys, ascending, relatedCourses } = this.data;
    const sortKeyIndex = Number(detail.value);

    this.setData({
      sortKeyIndex,
      relatedCourses: relatedCourses.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending)
      ),
    });
  },

  changeRelatedSorting() {
    const { relatedCourses, sortKeys, sortKeyIndex, ascending } = this.data;

    this.setData({
      ascending: !ascending,
      relatedCourses: relatedCourses.sort(
        courseSorter(sortKeys[sortKeyIndex], !ascending)
      ),
    });
  },

  toggleRelatedLocationFilter() {
    const { sortKeys, sortKeyIndex, ascending, filterLocation } = this.data;
    const newValue = !filterLocation;
    const { currentLocation, relatedCourses } = this.state;

    this.setData({
      filterLocation: newValue,

      relatedCourses: relatedCourses
        .filter((item) => !newValue || item.place.includes(currentLocation))
        .sort(courseSorter(sortKeys[sortKeyIndex], ascending)),
    });
  },

  refreshInfoAmount() {
    const { courseInfo, relatedCourses } = this.data;

    this.getAmount(courseInfo!.id).then((data) => {
      if (data.status === "success") {
        const record = data.data.find((item) => item.cid === courseInfo!.cid);

        if (!record) logger.error("未找到课程人数", courseInfo!.cid);

        this.setData({
          courseInfo: {
            ...courseInfo!,
            amount: record ? record.amount : 0,
          },
          relatedCourses: relatedCourses.map((course) => {
            const record = data.data.find((item) => item.cid === course.cid);

            if (!record) logger.error("未找到课程人数", courseInfo!.cid);

            return { ...course, amount: record ? record.amount : 0 };
          }),
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
    if (weekIndex) options.week = weekIndex.toString();
    if (courseTypeIndex) options.courseType = courseTypes[courseTypeIndex - 1];
    if (officeIndex) options.office = courseOffices[officeIndex - 1];
    if (gradeIndex) options.grade = grades[gradeIndex - 1];
    if (majorIndex) options.major = majors[majorIndex - 1].id;
    if (classIndex)
      options.index = ["0102", "0304", "0506", "0708", "0910", "1112"][
        classIndex - 1
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
    const { sortKeys, sortKeyIndex, ascending, filterLocation } = this.data;
    const { currentLocation, selectedCourseIds } = this.state;

    wx.showLoading({ title: "获取人数" });

    return this.getAmount(id).then((res) => {
      wx.hideLoading();
      if (res.status === "success") {
        const { courses } = this.state;

        const coursesDetail = res.data
          .map(({ cid, amount }) => {
            const course = courses.find((item) => item.cid === cid);

            if (course)
              return {
                ...course,
                isSelected: selectedCourseIds.includes(cid),
                amount,
              };

            logger.error("未找到匹配课程", cid);

            return null;
          })
          .filter((item): item is FullCourseInfo => item !== null);

        this.state.currentCourseId = id;
        this.state.coursesDetail = coursesDetail;
        this.setData({
          coursesDetail: coursesDetail
            .filter(
              (item): item is FullCourseInfo =>
                !filterLocation || item.place.includes(currentLocation)
            )
            .sort(courseSorter(sortKeys[sortKeyIndex], ascending)),
        });
      } else {
        modal("获取人数失败", res.msg);
        if (res.type === "relogin") this.$redirect(PAGE_ID);
      }
    });
  },

  changeDetailSorter({ detail }: WechatMiniprogram.PickerChange) {
    const { sortKeys, ascending, coursesDetail } = this.data;
    const sortKeyIndex = Number(detail.value);

    this.setData({
      sortKeyIndex,
      coursesDetail: coursesDetail.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending)
      ),
    });
  },

  changeDetailSorting() {
    const { coursesDetail, sortKeys, sortKeyIndex, ascending } = this.data;

    this.setData({
      ascending: !ascending,
      coursesDetail: coursesDetail.sort(
        courseSorter(sortKeys[sortKeyIndex], !ascending)
      ),
    });
  },

  toggleDetailLocationFilter() {
    const { sortKeys, sortKeyIndex, ascending, filterLocation } = this.data;
    const newValue = !filterLocation;
    const { currentLocation, coursesDetail } = this.state;

    this.setData({
      filterLocation: newValue,

      coursesDetail: coursesDetail
        .filter((item) => !newValue || item.place.includes(currentLocation))
        .sort(courseSorter(sortKeys[sortKeyIndex], ascending)),
    });
  },

  refreshDetailAmount() {
    const { coursesDetail } = this.data;
    const { currentCourseId } = this.state;

    wx.showLoading({ title: "刷新人数" });

    return this.getAmount(currentCourseId).then((res) => {
      wx.hideLoading();
      if (res.status === "success") {
        this.setData({
          coursesDetail: coursesDetail.map((course) => {
            const record = res.data.find((item) => item.cid === course.cid);

            if (!record) logger.error("未找到课程人数", course.cid);

            return { ...course, amount: record ? record.amount : 0 };
          }),
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
              if (res.type === "relogin") this.$redirect(PAGE_ID);

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
              if (res.type === "relogin") this.$redirect(PAGE_ID);

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

    if (!this.state.isForceSelecting)
      modal(
        "连续选课",
        "您确认连续选课?",
        () => {
          wx.showLoading({ title: "选课中" });
          let completeTime = 0;

          const handler = (
            result:
              | { interrupted: false }
              | {
                  interrupted: true;
                  msg: ForceSelectMessage;
                }
          ): void => {
            wx.hideLoading();
            completeTime += 1;
            this.state.isForceSelecting = false;

            if (result.interrupted) {
              const { msg, type } = result.msg;

              modal(type === "success" ? "选课成功" : "选课失败", msg);
              if (type === "relogin") this.$redirect(PAGE_ID);
            } else requestForceSelect();
          };

          const requestForceSelect = (): void => {
            modal(
              "操作完成",
              `您已连续选课${completeTime * times}次，是否继续?`,
              () => {
                this.doSelectCourse(cid, times).then(handler);
              },
              () => {
                // cancel
              }
            );
          };

          this.state.isForceSelecting = true;
          this.doSelectCourse(cid, times).then(handler);
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
      const isSuccess = res.status === "success";

      if (isSuccess) {
        const {
          courseOffices,
          courseTable,
          courseTypes,
          courses,
          currentGrade,
          currentLocation,
          currentMajor,
          grades,
          majors,
          jx0502id,
          jx0502zbid,
        } = res;

        this.state = {
          ...this.state,
          currentGrade,
          currentLocation,
          currentMajor,
          jx0502id,
          jx0502zbid,
          courses,
          selectedCourseIds: courseTable
            .map((row) => row.map((cell) => cell.map(({ cid }) => cid)))
            .flat(3),
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
      } else {
        modal("获取信息失败", res.msg, () => {
          this.back();
        });
      }

      return isSuccess;
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
      else {
        modal("查询失败", res.msg);
        if (res.type === "relogin") this.$redirect(PAGE_ID);
      }
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
    let stop: (msg: ForceSelectMessage) => void;

    const queue = Array<() => Promise<void>>(times).fill(() =>
      this.process("add", cid).then((res) => {
        if (res.status === "success")
          stop({
            type: "success",
            msg: "选课成功",
          });
        else if (res.type)
          stop({
            type: res.type,
            msg: res.msg,
          });
      })
    );

    const selectQueue = promiseQueue<ForceSelectMessage>(queue);

    stop = selectQueue.stop;

    return selectQueue.run();
  },

  back() {
    if (getCurrentPages().length === 1) this.$switch("main");
    else this.$back();
  },
});
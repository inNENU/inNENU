import { $Page, logger } from "@mptool/all";

import { getAmount, getInfo, login, process, search } from "./api.js";
import type {
  CourseBasicInfo,
  CourseData,
  CourseInfo,
  MajorInfo,
  SearchOptions,
} from "./typings.js";
import type { FullCourseInfo, SortKey } from "./utils.js";
import { confirmReplace, courseSorter } from "./utils.js";
import { getCurrentRoute, showModal, showToast } from "../../api/index.js";
import { appCoverPrefix } from "../../config/index.js";
import { LoginFailType } from "../../service/index.js";
import { info } from "../../state/info.js";
import { user } from "../../state/user.js";
import { getColor, popNotice } from "../../utils/page.js";
import { promiseQueue } from "../utils/promiseQueue.js";

interface ForceSelectMessage {
  type: "success" | LoginFailType.Expired | "conflict" | "forbidden";
  msg: string;
}

const PAGE_TITLE = "选课系统";
const PAGE_ID = "select";

$Page(PAGE_ID, {
  data: {
    nav: {
      title: PAGE_TITLE,
    },
    theme: info.theme,

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
      title: "课程详情",
      confirm: "刷新人数",
      cancel: false,
    },
    relatedCourses: <FullCourseInfo[]>[],

    courseDetailPopupConfig: {
      title: "课程列表",
      confirm: "刷新人数",
      cancel: false,
    },
    showCourseDetail: false,
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
    server: "",
    type: <"under" | "post">"under",
    jx0502id: "",
    jx0502zbid: "",

    courses: [] as CourseInfo[],

    currentGrade: "",
    currentLocation: "",
    currentMajor: "",
    selectedCourseIds: <string[]>[],

    currentCourseId: "",
    currentCredit: 0,
    coursesDetail: <FullCourseInfo[]>[],
    relatedCourses: <FullCourseInfo[]>[],
    isForceSelecting: false,
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: info.theme,
      firstPage: getCurrentPages().length === 1,
    });
  },

  onShow() {
    const { account } = user;

    if (account) {
      wx.showLoading({ title: "登录中", mask: true });

      login(account)
        .then(async (data) => {
          wx.hideLoading();

          if (!data.success)
            return showModal("登录失败", data.msg, (): void => {
              this.$go("account?from=选课系统&update=true");
            });

          this.state.server = data.server;
          this.state.type = user.info!.typeId === "bks" ? "under" : "post";

          this.setData({ login: true }, () => {
            this.createSelectorQuery()
              .select(".select-container")
              .fields({ size: true }, (res) => {
                if (res) this.setData({ height: res.height as number });
              })
              .exec();
          });

          wx.showLoading({ title: "获取信息" });

          try {
            const isSuccess = await this.loadInfo();

            if (isSuccess)
              await this.search({
                grade: this.state.currentGrade,
                major: this.state.currentMajor,
              });
            wx.hideLoading();
          } catch (err) {
            wx.hideLoading();
            showToast("获取信息失败");
          }
        })
        .catch(() => {
          showModal(
            "登录失败",
            `\
请检查:
1. 是否在选课时间
2. 网络连接是否有效
`,
            (): void => {
              if (getCurrentRoute() === "function/select/select") this.$back();
            },
          );
        });
    }
    // TODO: use login-hint
    else {
      showModal(
        "请先登录",
        "暂无账号信息，请输入",
        (): void => {
          this.$go("account?from=选课系统&update=true");
        },
        () => {
          if (getCurrentRoute() === "function/select/select") this.$back();
        },
      );
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
      (item) => item.cid === cid,
    );

    if (course) {
      this.getAmount(course.id).then((data) => {
        wx.hideLoading();
        if (data.success) {
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
                item !== null && item.cid !== course.cid,
            );

          this.state.relatedCourses = relatedCourses;

          this.setData({
            courseInfo,
            relatedCourses: relatedCourses
              .filter(
                (item) =>
                  !filterLocation || item.place.includes(currentLocation),
              )
              .sort(courseSorter(sortKeys[sortKeyIndex], ascending)),
          });
        } else {
          showModal("获取课程人数失败", data.msg);
          if (data.type === LoginFailType.Expired) this.$redirect(PAGE_ID);
        }
      });
    } else {
      wx.hideLoading();
      showModal("未找到课程信息", "暂无所选课程数据，请汇报给开发者!");
    }
  },

  changeRelatedSorter({ detail }: WechatMiniprogram.PickerChange) {
    const { sortKeys, ascending, relatedCourses } = this.data;
    const sortKeyIndex = Number(detail.value);

    this.setData({
      sortKeyIndex,
      relatedCourses: relatedCourses.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending),
      ),
    });
  },

  changeRelatedSorting() {
    const { relatedCourses, sortKeys, sortKeyIndex, ascending } = this.data;

    this.setData({
      ascending: !ascending,
      relatedCourses: relatedCourses.sort(
        courseSorter(sortKeys[sortKeyIndex], !ascending),
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

  async refreshInfoAmount() {
    const { courseInfo, relatedCourses } = this.data;

    const data = await this.getAmount(courseInfo!.id);

    if (data.success) {
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
      showModal("获取课程人数失败", data.msg);
    }
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

  async showCourseDetail({
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

    const result = await this.getAmount(id);

    wx.hideLoading();
    if (result.success) {
      const { courses } = this.state;

      const coursesDetail = result.data
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
              !filterLocation || item.place.includes(currentLocation),
          )
          .sort(courseSorter(sortKeys[sortKeyIndex], ascending)),
        showCourseDetail: true,
      });
    } else {
      showModal("获取人数失败", result.msg);
      if (result.type === LoginFailType.Expired) this.$redirect(PAGE_ID);
    }
  },

  changeDetailSorter({ detail }: WechatMiniprogram.PickerChange) {
    const { sortKeys, ascending, coursesDetail } = this.data;
    const sortKeyIndex = Number(detail.value);

    this.setData({
      sortKeyIndex,
      coursesDetail: coursesDetail.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending),
      ),
    });
  },

  changeDetailSorting() {
    const { coursesDetail, sortKeys, sortKeyIndex, ascending } = this.data;

    this.setData({
      ascending: !ascending,
      coursesDetail: coursesDetail.sort(
        courseSorter(sortKeys[sortKeyIndex], !ascending),
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

  async refreshDetailAmount() {
    const { coursesDetail } = this.data;
    const { currentCourseId } = this.state;

    wx.showLoading({ title: "刷新人数" });

    const res = await this.getAmount(currentCourseId);

    wx.hideLoading();
    if (res.success) {
      this.setData({
        coursesDetail: coursesDetail.map((course) => {
          const record = res.data.find((item) => item.cid === course.cid);

          if (!record) logger.error("未找到课程人数", course.cid);

          return { ...course, amount: record ? record.amount : 0 };
        }),
      });
    } else {
      showModal("刷新人数失败", res.msg);
    }
  },

  closeDetailPopup() {
    this.state.currentCourseId = "";
    this.state.coursesDetail = [];
    this.setData({ coursesDetail: [], showCourseDetail: false });
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
      showModal(
        "选课确认",
        "您确认选择此课程?",
        () =>
          resolve(
            this.process("add", cid).then((res) => {
              if (res.success) {
                showToast("选课成功", 1000, "success");
                // 关闭任何可能的弹窗
                this.setData({
                  courseInfo: null,
                  coursesDetail: [],
                  relatedCourses: [],
                  showCourseDetail: false,
                });
                this.loadInfo();

                return true;
              }

              showModal("选课失败", res.msg);

              // 重新进入本页面
              if (res.type === LoginFailType.Expired) this.$redirect(PAGE_ID);

              return false;
            }),
          ),
        () => resolve(false),
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
      showModal(
        "退课确认",
        "您确认退选此课程?",
        () =>
          resolve(
            this.process("delete", cid).then((res) => {
              if (res.success) {
                showToast("退课成功", 1000, "success");
                // 关闭任何可能的弹窗
                this.setData({
                  courseInfo: null,
                  coursesDetail: [],
                  relatedCourses: [],
                  showCourseDetail: false,
                });
                this.loadInfo();

                return true;
              }

              showModal("退课失败", res.msg);

              // 重新进入本页面
              if (res.type === LoginFailType.Expired) this.$redirect(PAGE_ID);

              return false;
            }),
          ),
        () => resolve(false),
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
      showModal(
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
                },
          ): void => {
            wx.hideLoading();
            completeTime += 1;
            this.state.isForceSelecting = false;

            if (result.interrupted) {
              const { msg, type } = result.msg;

              showModal(type === "success" ? "选课成功" : "选课失败", msg);
              if (type === "success") this.loadInfo();
              else if (type === LoginFailType.Expired) this.$redirect(PAGE_ID);
            } else requestForceSelect();
          };

          const requestForceSelect = (): void => {
            showModal(
              "操作完成",
              `您已连续选课${completeTime * times}次，是否继续?`,
              () => {
                wx.showLoading({ title: "选课中" });
                this.doSelectCourse(cid, times).then(handler);
              },
              () => {
                // cancel
              },
            );
          };

          this.state.isForceSelecting = true;
          this.doSelectCourse(cid, times).then(handler);
        },
        () => {
          // cancel
        },
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
          showModal(
            "确认替换课程",
            "您确认尝试替换已有课程为此课程",
            () => {
              const { id, cid, oid } = currentTarget.dataset;

              const { capacity } = this.state.courses.find(
                (item) => item.cid === cid,
              )!;

              resolve(
                this.getAmount(id).then((data) => {
                  if (data.success) {
                    const amount = data.data.find(
                      (item) => item.cid === cid,
                    )?.amount;

                    if (
                      typeof amount === "number" &&
                      amount < Number(capacity)
                    ) {
                      wx.showLoading({ title: "退课中" });

                      return this.process("delete", oid)
                        .then((res) => {
                          wx.hideLoading();

                          if (res.success) {
                            wx.showLoading({ title: "选课中" });

                            return this.process("add", cid).then((res) => {
                              wx.hideLoading();
                              if (res.success) {
                                showModal("替换课程成功", "您已成功替换课程");

                                return true;
                              }

                              wx.showLoading({ title: "撤销中" });

                              return this.process("add", oid).then((res) => {
                                wx.hideLoading();

                                if (res.success) {
                                  showModal(
                                    "替换课程失败",
                                    "由于退课后新课程人数已满，所选课程选课失败。由于原课程人数未满，已成功为您选回原课程。",
                                  );

                                  return false;
                                }

                                showModal(
                                  "替换课程失败",
                                  "由于退课后新课程人数已满，且旧课程人数也满，您丢失了此课程。",
                                );

                                return false;
                              });
                            });
                          }

                          showModal("退课失败", res.msg);

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

                    showModal("替换失败", "所选课程已满，无法替换操作");

                    return false;
                  }

                  showModal(
                    "获取人数失败",
                    "无法获取新课程是否已满，取消替换操作",
                  );

                  return false;
                }),
              );
            },
            () => {
              resolve(false);
            },
          );
        });
      }

      return Promise.resolve(false);
    });
  },

  async loadInfo() {
    const data = await getInfo({
      server: this.state.server,
      type: this.state.type,
    });

    if (data.success) {
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
        info,
        jx0502id,
        jx0502zbid,
      } = data;

      const selectedCourseIds = Array.from(
        new Set(
          courseTable
            .map((row) => row.map((cell) => cell.map(({ cid }) => cid)))
            .flat(3),
        ),
      );

      this.state = {
        ...this.state,
        currentGrade,
        currentLocation,
        currentMajor,
        jx0502id,
        jx0502zbid,
        courses,
        selectedCourseIds,
      };

      const currentCredit = selectedCourseIds
        .map((cid) => courses.find((item) => item.cid === cid))
        .reduce((sum, item) => (item ? item.point + sum : sum), 0);

      this.setData({
        courseOffices,
        courseTable,
        courseTypes,
        currentCredit,
        grades,
        gradeIndex: grades.findIndex((item) => item === currentGrade) + 1,
        majors,
        majorIndex: majors.findIndex((item) => item.id === currentMajor) + 1,
        info,
      });
    } else {
      showModal("获取信息失败", data.msg, () => {
        this.$back();
      });
    }

    return data.success;
  },

  getAmount(courseId: string) {
    return getAmount({
      server: this.state.server,
      jx0502id: this.state.jx0502id,
      courseId,
    });
  },

  async search(
    options: Omit<SearchOptions, "cookies" | "server" | "jx0502id">,
  ) {
    const data = await search({
      server: this.state.server,
      jx0502id: this.state.jx0502id,
      ...options,
    });

    if (data.success) this.setData({ courses: data.courses });
    else {
      showModal("查询失败", data.msg);
      if (data.type === LoginFailType.Expired) this.$redirect(PAGE_ID);
    }
  },

  process(type: "add" | "delete", courseId: string) {
    console.log(courseId);

    return process(type, {
      courseId,
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
        if (res.success)
          stop({
            type: "success",
            msg: "选课成功",
          });
        else if (res.type)
          stop({
            type: res.type,
            msg: res.msg,
          });
      }),
    );

    const selectQueue = promiseQueue<ForceSelectMessage>(queue);

    stop = selectQueue.stop;

    return selectQueue.run();
  },
});

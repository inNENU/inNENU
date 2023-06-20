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
import { modal } from "../../utils/api.js";
import { type AccountInfo } from "../../utils/app.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();

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

    showCourseDetail: false,
    coursesDetail: <(CourseInfo & { amount?: number })[]>[],
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
    // do nothing
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

  pickerChange({ currentTarget, detail }: WechatMiniprogram.PickerChange) {
    this.setData({ [currentTarget.dataset.key]: detail.value });
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

  showCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { id: string }
  >) {
    const { id } = currentTarget.dataset;

    wx.showLoading({ title: "获取人数" });

    return getAmount({
      cookies: this.state.cookies,
      server: this.state.server,
      jx0502id: this.state.jx0502id,
      id,
    }).then((data) => {
      wx.hideLoading();
      if (data.status === "success") {
        this.setData({
          showCourseDetail: true,
          coursesDetail: data.data.map(({ id, amount }) => ({
            amount,
            ...this.state.courses.find(({ cid }) => cid === id)!,
          })),
        });
      } else {
        modal("获取人数失败", data.msg);
        const coursesDetail = this.state.courses.filter(
          (item) => item.id === id
        );

        this.setData({
          showCourseDetail: true,
          coursesDetail,
        });
      }
    });
  },

  closePopup() {
    this.setData({ showCourseDetail: false });
  },

  loadInfo() {
    return getInfo({
      cookies: this.state.cookies,
      server: this.state.server,
    }).then((data) => {
      console.log(data);
      if (data.status === "success") {
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
        } = data;

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

  selectCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { cid: string }
  >) {
    const { cid } = currentTarget.dataset;

    modal(
      "选课确认",
      "您确认选择此课程?",
      () => {
        process("add", {
          cookies: this.state.cookies,
          id: cid,
          server: this.state.server,
          jx0502id: this.state.jx0502id,
          jx0502zbid: this.state.jx0502zbid,
        }).then(() => {
          this.setData({
            showCourseDetail: false,
          });
        });
      },
      () => {
        // do nothing
      }
    );
  },
});

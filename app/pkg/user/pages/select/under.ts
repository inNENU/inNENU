import { $Page } from "@mptool/all";

import type { ClassData, SortKey } from "./utils.js";
import { confirmReplace, courseSorter } from "./utils.js";
import { showModal, showToast } from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import type {
  AuthLoginFailedResponse,
  CommonFailedResponse,
  CommonSuccessResponse,
  FailResponse,
} from "../../../../service/index.js";
import { ActionFailType } from "../../../../service/index.js";
import { envName, info, user } from "../../../../state/index.js";
import { getPageColor, showNotice } from "../../../../utils/index.js";
import type {
  SelectOptionConfig,
  UnderSelectAllowedCategoryItem,
  UnderSelectClassInfo,
  UnderSelectCourseInfo,
  UnderSelectDisallowedCategoryItem,
  UnderSelectProcessResponse,
  UnderSelectSearchOptions,
} from "../../service/index.js";
import {
  getUnderCourseClasses,
  getUnderSelectCategories,
  getUnderSelectInfo,
  getUnderSelectedClasses,
  searchUnderCourses,
} from "../../service/index.js";
import { processUnderSelect } from "../../service/under-study/index.js";
import { createQueue } from "../../utils/index.js";

type ForceSelectResponse =
  | CommonSuccessResponse<string>
  | CommonFailedResponse<ActionFailType.MissingCredential>
  | AuthLoginFailedResponse
  | FailResponse<UnderSelectProcessResponse>;

const PAGE_TITLE = "本科选课系统";
const PAGE_ID = "under-select";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,

    status: "success" as "login" | "error" | "success",

    // ===== 分类 =====

    /** 分类信息 */
    allowed: [] as UnderSelectAllowedCategoryItem[],
    disallowed: [] as UnderSelectDisallowedCategoryItem[],
    /** 当前分类 */
    category: null as UnderSelectAllowedCategoryItem | null,

    // ===== 课程信息 =====

    // courseTable: [] as CourseData[][][],
    // courses: [] as CourseBasicInfo[],
    /** 已选课程 */
    selectedClasses: [] as UnderSelectClassInfo[],

    // ===== 搜索信息 =====

    // ----- 选项 -----
    offices: [] as SelectOptionConfig[],
    types: [] as SelectOptionConfig[],
    categories: [] as SelectOptionConfig[],
    majors: [] as SelectOptionConfig[],
    grades: [] as number[],

    // ----- 选择 -----
    course: "",
    teacher: "",
    place: "",
    classIndex: 0,
    typeIndex: 0,
    categoryIndex: 0,
    officeIndex: 0,
    gradeIndex: 0,
    majorIndex: 0,
    weekIndex: 0,

    // ===== 搜索结果 =====
    searchResult: [] as UnderSelectCourseInfo[],

    // ===== 课程信息 =====
    classData: null as ClassData | null,
    classDataPopupConfig: {
      title: "课程详情",
      confirm: "刷新人数",
      cancel: false,
    },
    relatedClasses: [] as ClassData[],

    // ===== 班级信息 =====
    classesPopupConfig: {
      title: "班级列表",
      confirm: "刷新人数",
      cancel: false,
    },
    showClasses: false,
    classesResult: [] as ClassData[],

    sortKeys: [
      "className",
      "teacher",
      "spare",
      "current",
      "capacity",
    ] as SortKey[],
    sortKeyIndex: 0,
    ascending: true,
  },

  state: {
    status: "check" as "login" | "check" | "validate",

    currentArea: "",
    currentGrade: 0,
    currentMajor: "",

    currentCourseId: "",
    // TODO: Support this
    currentCredit: 0,

    /** 是否强制选课 */
    isForceSelecting: false,
  },

  onLoad() {
    this.setData({
      color: getPageColor(),
      theme: info.theme,
    });
  },

  onShow() {
    const { account, info } = user;

    if (!account) {
      this.setData({ status: "login" });
    } else if (!info) {
      return showModal(
        "个人信息缺失",
        `${envName}本地暂无个人信息，请重新登录`,
        () => {
          this.$go("account-login?update=true");
        },
      );
    } else if (info.typeId !== "bks") {
      return showModal("暂不支持", "当前为本科选课系统", () => {
        this.$back();
      });
    } else {
      this.loadCategories();
    }

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onInput({
    target,
    detail,
  }: WechatMiniprogram.Input<Record<never, never>, { key: string }>) {
    this.setData({ [target.dataset.key]: detail.value });
  },

  onPickerChange({
    target,
    detail,
  }: WechatMiniprogram.PickerChange<Record<never, never>, { key: string }>) {
    this.setData({ [target.dataset.key]: Number(detail.value) });
  },

  /** 重新加载选课系统 */
  reload() {
    const { category } = this.data;

    if (category) this.initCategory(category.link);
    else this.loadCategories();
  },

  /** 加载选课入口 */
  async loadCategories() {
    wx.showLoading({ title: "获取选课入口", mask: true });

    const result = await getUnderSelectCategories();

    wx.hideLoading();

    if (!result.success) {
      if (result.type === ActionFailType.NotInitialized)
        return showModal("未初始化", result.msg, () => {
          this.$back();
        });

      return this.setData({
        status: "error",
        errMsg: result.msg,
      });
    }

    this.setData({
      allowed: result.data.allowed,
      disallowed: result.data.disallowed,
    });
  },

  /** 选择选课入口 */
  async selectCategory({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { category: UnderSelectAllowedCategoryItem }
  >) {
    const { category } = currentTarget.dataset;

    this.setData({ status: "success", category }, () => {
      this.createSelectorQuery()
        .select(".select-container")
        .fields({ size: true }, (res) => {
          if (res) this.setData({ height: res.height as number });
        })
        .exec();
    });
    await this.initCategory(category.link);
  },

  /** 初始化选课入口 */
  async initCategory(link: string) {
    await this.loadInfo(link);
    await this.loadSelectedCourses(link);
    wx.showLoading({ title: "加载默认课程" });
    await this.searchCourses(true);
    wx.hideLoading();
  },

  /** 重置选课入口 */
  resetCategory() {
    this.setData({ category: null, selectedClasses: [] });
  },

  /** 加载用户信息 */
  async loadInfo(link: string, silent = false) {
    if (!silent) wx.showLoading({ title: "获取信息", mask: true });

    const result = await getUnderSelectInfo(link);

    if (!silent) wx.hideLoading();

    if (!result.success) {
      this.setData({
        status: "error",
        errMsg: `获取用户信息失败: ${result.msg}`,
      });

      return false;
    }

    const {
      offices,
      categories,
      types,
      majors,
      grades,

      currentArea,
      currentGrade,
      currentMajor,
    } = result.data;

    this.state = {
      ...this.state,
      currentArea,
      currentGrade,
      currentMajor,
    };

    this.setData({
      offices,
      categories,
      types,
      grades,

      gradeIndex: grades.findIndex((item) => item === currentGrade) + 1,
      majorIndex: majors.findIndex((item) => item.name === currentMajor) + 1,
      officeIndex: 0,
      categoryIndex: 0,
      typeIndex: 0,
      majors,
    });

    return true;
  },

  async loadSelectedCourses(link: string, silent = false) {
    if (!silent) wx.showLoading({ title: "获取已选课程", mask: true });

    const result = await getUnderSelectedClasses(link);

    if (!silent) wx.hideLoading();

    if (!result.success) {
      this.setData({
        status: "error",
        errMsg: `获取已选课程失败: ${result.msg}`,
      });

      return false;
    }

    const selectedClasses = result.data;

    const currentCredit = selectedClasses.reduce(
      (sum, item) => (item ? item.point + sum : sum),
      0,
    );

    this.setData({ currentCredit, selectedClasses });

    return true;
  },

  async searchCourses(silent = false) {
    const {
      category,

      categories,
      types,
      offices,
      grades,
      majors,

      course,
      teacher,
      place,

      classIndex,
      categoryIndex,
      typeIndex,
      officeIndex,
      gradeIndex,
      majorIndex,
      weekIndex,
    } = this.data;
    const options: UnderSelectSearchOptions = { link: category!.link };

    if (course) options.name = course;
    if (teacher) options.teacher = teacher;
    if (place) options.place = place;
    if (weekIndex) options.week = weekIndex.toString();
    if (categoryIndex) options.category = categories[categoryIndex - 1].name;
    if (typeIndex) options.type = types[typeIndex - 1].value;
    if (officeIndex) options.office = offices[officeIndex - 1].value;
    if (gradeIndex) options.grade = grades[gradeIndex - 1];
    if (majorIndex) options.major = majors[majorIndex - 1].value;

    // FIXME: ClassIndex format
    if (classIndex)
      options.classIndex = ["0102", "0304", "0506", "0708", "0910", "1112"][
        classIndex - 1
      ];

    if (!silent) wx.showLoading({ title: "搜索中" });

    const result = await searchUnderCourses(options);

    if (!silent) wx.hideLoading();

    if (!result.success) {
      showModal("搜索失败", result.msg);

      return;
    }

    this.setData({ searchResult: result.data });
  },

  async loadClasses({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { id?: string }
  >) {
    const courseId = currentTarget.dataset.id || this.state.currentCourseId;
    const { category, selectedClasses, sortKeys, sortKeyIndex, ascending } =
      this.data;

    wx.showLoading({ title: "获取班级信息" });

    const result = await getUnderCourseClasses({
      link: category!.link,
      courseId,
    });

    wx.hideLoading();

    if (!result.success) return showModal("获取班级信息失败", result.msg);

    const selectedIndex = result.data.findIndex((item) =>
      selectedClasses.some(({ classId }) => classId === item.classId),
    );

    const classesResult: ClassData[] = result.data.map((item, index) => ({
      ...item,
      isSelected: selectedIndex === index,
      state:
        selectedIndex === -1 || selectedIndex === index ? "action" : "replace",
    }));

    this.state.currentCourseId = courseId;

    this.setData({
      classesResult: classesResult.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending),
      ),
      showClasses: true,
    });
  },

  changeClassesSorter({ detail }: WechatMiniprogram.PickerChange) {
    const { sortKeys, ascending, classesResult } = this.data;
    const sortKeyIndex = Number(detail.value);

    this.setData({
      sortKeyIndex,
      classesResult: classesResult.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending),
      ),
    });
  },

  changeClassesSorting() {
    const { classesResult, sortKeys, sortKeyIndex, ascending } = this.data;

    this.setData({
      ascending: !ascending,
      classesResult: classesResult.sort(
        courseSorter(sortKeys[sortKeyIndex], !ascending),
      ),
    });
  },

  closeClassesPopup() {
    this.setData({ classesResult: [], showClasses: false });
  },

  async showClassInfo({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { classId: string }
  >) {
    const { classId } = currentTarget.dataset;
    const { category, selectedClasses, sortKeys, sortKeyIndex, ascending } =
      this.data;

    const { id } = selectedClasses.find((item) => item.classId === classId)!;

    wx.showLoading({ title: "获取详细信息" });

    const result = await getUnderCourseClasses({
      link: category!.link,
      courseId: id,
    });

    wx.hideLoading();

    if (!result.success) return showModal("获取相关课程失败", result.msg);

    const selectedIndex = result.data.findIndex((item) =>
      selectedClasses.some(({ classId }) => classId === item.classId),
    );

    const relatedClasses: ClassData[] = result.data
      .filter((_, index) => index !== selectedIndex)
      .map((item) => ({
        ...item,
        isSelected: false,
        state: "replace",
      }));

    this.setData({
      classData: {
        ...result.data[selectedIndex],
        isSelected: true,
        state: "action",
      },
      relatedClasses: relatedClasses.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending),
      ),
    });
  },

  changeRelatedSorter({ detail }: WechatMiniprogram.PickerChange) {
    const { sortKeys, ascending, relatedClasses } = this.data;
    const sortKeyIndex = Number(detail.value);

    this.setData({
      sortKeyIndex,
      relatedClasses: relatedClasses.sort(
        courseSorter(sortKeys[sortKeyIndex], ascending),
      ),
    });
  },

  changeRelatedSorting() {
    const { relatedClasses, sortKeys, sortKeyIndex, ascending } = this.data;

    this.setData({
      ascending: !ascending,
      relatedClasses: relatedClasses.sort(
        courseSorter(sortKeys[sortKeyIndex], !ascending),
      ),
    });
  },

  closeCourseDataPopup() {
    this.setData({ classData: null, relatedClasses: [] });
  },

  selectCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { name: string; classId: string }
  >) {
    return new Promise((resolve) => {
      const { name, classId } = currentTarget.dataset;
      const { link } = this.data.category!;

      showModal(
        "选课确认",
        "您确认选择此课程?",
        () =>
          resolve(
            processUnderSelect({
              type: "add",
              link: this.data.category!.link,
              name,
              classId,
            }).then((res) => {
              if (res.success) {
                showToast("选课成功", 1000, "success");

                // 关闭任何可能的弹窗
                this.setData({
                  classData: null,
                  classesResult: [],
                  relatedClasses: [],
                  showClasses: false,
                });

                // avoid the success hint being covered by loading state
                this.loadSelectedCourses(link, true);
                // TODO: Update credit info

                return true;
              }

              showModal("选课失败", res.msg);

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
    { name: string; classId: string }
  >) {
    const { name, classId } = currentTarget.dataset;
    const { link } = this.data.category!;

    showModal(
      "退课确认",
      "您确认退选此课程?",
      async () => {
        const result = await processUnderSelect({
          type: "remove",
          link,
          name,
          classId,
        });

        if (!result.success) return showModal("退课失败", result.msg);

        showToast("退课成功", 1000, "success");
        // 关闭任何可能的弹窗
        this.setData({
          classData: null,
          classesResult: [],
          relatedClasses: [],
          showClasses: false,
        });

        // avoid the success hint being covered by loading state
        this.loadSelectedCourses(link, true);
        // TODO: Update credit info
      },
      () => {
        // cancel
      },
    );
  },

  trySelectingCourse(classId: string, name: string, times = 100) {
    // eslint-disable-next-line prefer-const
    let stop: (msg: ForceSelectResponse) => void;

    const queue = Array<() => Promise<void>>(times).fill(() =>
      processUnderSelect({
        type: "add",
        link: this.data.category!.link,
        name,
        classId,
      }).then((res) => {
        if (res.success)
          stop({
            success: true,
            data: `已成功强制选课${name}`,
          });
        else if (res.type !== ActionFailType.Full) stop(res);
      }),
    );

    const selectQueue = createQueue<ForceSelectResponse>(queue);

    stop = selectQueue.stop;

    return selectQueue.run();
  },

  forceSelectCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { name: string; classId: string }
  >) {
    const { name, classId } = currentTarget.dataset;
    const { link } = this.data.category!;
    const times = 100;
    let completeTimes = 0;

    if (!this.state.isForceSelecting)
      showModal(
        "连续选课",
        "您确认连续选课?",
        () => {
          wx.showLoading({ title: "选课中", mask: true });

          const handler = (
            result:
              | { interrupted: false }
              | {
                  interrupted: true;
                  msg: ForceSelectResponse;
                },
          ): void => {
            wx.hideLoading();
            completeTimes += 1;
            this.state.isForceSelecting = false;

            if (result.interrupted)
              if (result.msg.success) {
                showModal("选课成功", result.msg.data);

                this.loadSelectedCourses(link);
                // TODO: Update credit info
              } else {
                showModal("选课失败", result.msg.msg);
              }
            else requestForceSelect();
          };

          const requestForceSelect = (): void => {
            showModal(
              "操作完成",
              `您已连续选课${completeTimes * times}次，是否继续?`,
              () => {
                wx.showLoading({ title: "选课中" });
                this.trySelectingCourse(classId, name, times).then(handler);
              },
              () => {
                // cancel
              },
            );
          };

          this.state.isForceSelecting = true;
          this.trySelectingCourse(classId, name, times).then(handler);
        },
        () => {
          // cancel
        },
      );
  },

  async replaceCourse({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { id: string; classId: string; oldClassId: string }
  >) {
    const confirm = await confirmReplace();

    if (confirm) {
      const { link } = this.data.category!;
      const { id, classId, oldClassId } = currentTarget.dataset;

      showModal(
        "确认替换课程",
        "您确认尝试替换已有课程为此课程",
        async () => {
          const result = await getUnderCourseClasses({
            link,
            courseId: id,
          });

          if (!result.success) {
            return showModal(
              "查询剩余课容量失败",
              "无法确认新课程存在空余名额，取消替换操作",
            );
          }

          const { name, current, capacity } = result.data.find(
            (item) => item.classId === classId,
          )!;

          if (current >= capacity) {
            return showModal("替换失败", "所选课程已满，无法替换操作");
          }

          wx.showLoading({ title: "退课中" });

          const removeResult = await processUnderSelect({
            type: "remove",
            link,
            name,
            classId: oldClassId,
          });

          wx.hideLoading();

          if (!removeResult.success)
            return showModal("退课失败", removeResult.msg);

          wx.showLoading({ title: "选课中" });

          const selectResult = await processUnderSelect({
            type: "add",
            link,
            name,
            classId,
          });

          if (!selectResult.success) {
            wx.showLoading({ title: "撤销中" });

            const reSelectResult = await processUnderSelect({
              type: "add",
              link,
              name,
              classId: oldClassId,
            });

            wx.hideLoading();

            if (!reSelectResult.success) {
              return showModal(
                "替换课程失败",
                "由于退课后待选课程人数已满，且原课程人数也满，您丢失了此课程。",
              );
            }

            return showModal(
              "替换课程失败",
              "由于退课后新课程人数已满，所选课程选课失败。由于原课程人数未满，已成功为您选回原课程。",
            );
          }

          wx.hideLoading();

          showModal("替换课程成功", "您已成功替换课程");

          this.setData({
            classData: null,
            relatedClasses: [],
          });

          this.loadSelectedCourses(link);
        },
        () => {
          // cancel
        },
      );
    }
  },
});

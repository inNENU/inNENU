import { $Page } from "@mptool/all";

import { retryAction, showModal } from "../../api/index.js";
import type { AppOption } from "../../app.js";
import type {
  InputUnderArchiveInfo,
  MultiSelectUnderArchiveInfo,
  SingleSelectUnderArchiveInfo,
  UnderArchiveFieldInfo,
  UnderFamilyOptions,
  UnderStudyOptions,
} from "../../service/index.js";
import {
  LoginFailType,
  ensureOnlineUnderSystemLogin,
  ensureUnderSystemLogin,
  getOnlineUnderStudentArchiveInfo,
  getUnderStudentArchiveInfo,
  submitOnlineUnderStudentArchiveAddress,
  submitOnlineUnderStudentArchiveFamily,
  submitOnlineUnderStudentArchiveInfo,
  submitOnlineUnderStudentArchiveStudy,
  submitUnderStudentArchiveAddress,
  submitUnderStudentArchiveFamily,
  submitUnderStudentArchiveInfo,
  submitUnderStudentArchiveStudy,
} from "../../service/index.js";
import { info } from "../../utils/info.js";
import { getColor, popNotice } from "../../utils/page.js";

const { globalData, useOnlineService } = getApp<AppOption>();
const { envName } = info;
const PAGE_ID = "create-archive";
const PAGE_TITLE = "建立学籍";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    stage: <"loading" | "info" | "address" | "study" | "family" | "success">(
      "loading"
    ),

    inputs: <InputUnderArchiveInfo[]>[],

    editable: <
      (
        | (MultiSelectUnderArchiveInfo & {
            categoryIndex: number;
            selectedIndex: number;
          })
        | (SingleSelectUnderArchiveInfo & { selectedIndex: number })
      )[]
    >[],

    family: <UnderFamilyOptions[]>[],
    study: <UnderStudyOptions[]>[],

    needLogin: false,
  },

  state: {
    loginMethod: <"check" | "login" | "validate">"validate",
    inited: false,
    infoFields: <UnderArchiveFieldInfo[]>[],
    infoPath: "",
    addressFields: <UnderArchiveFieldInfo[]>[],
    addressPath: "",
    studyFields: <UnderArchiveFieldInfo[]>[],
    studyPath: "",
    familyFields: <UnderArchiveFieldInfo[]>[],
    familyPath: "",
  },

  onLoad() {
    this.setData({
      color: getColor(),
      theme: info.theme,
    });
  },

  onShow() {
    const { account, userInfo } = globalData;

    if (account) {
      if (!userInfo) {
        return showModal(
          "个人信息缺失",
          `${envName}本地暂无个人信息，请重新登录`,
          () => {
            this.$go("account?update=true");
          },
        );
      }

      if (!this.state.inited || this.data.needLogin) {
        if (userInfo.typeId !== "bks")
          return showModal("暂不支持", `${PAGE_TITLE}仅支持本科生`, () => {
            this.$back();
          });

        this.getCreateArchiveInfo();
      }
    }

    this.setData({ needLogin: !globalData.account });

    popNotice(PAGE_ID);
  },

  onPickerChange({ target, detail }: WechatMiniprogram.PickerChange) {
    const { index } = target.dataset;

    this.setData({
      [`editable[${index}].selectedIndex`]: Number(detail.value),
    });
  },

  onMultiPickerColumnChange({
    target,
    detail,
  }: WechatMiniprogram.PickerColumnChange) {
    const { index } = target.dataset;

    if (detail.column === 0)
      this.setData({
        [`editable[${index}].categoryIndex`]: Number(detail.value),
        [`editable[${index}].selectedIndex`]: 0,
      });
    else if (detail.column === 1)
      this.setData({
        [`editable[${index}].selectedIndex`]: Number(detail.value),
      });
  },

  onMultiPickerChange({ target, detail }: WechatMiniprogram.PickerChange) {
    const { index } = target.dataset;

    this.setData({
      [`editable[${index}].selectedIndex`]: Number(detail.value[1]),
    });
  },

  onAddressInput({ target, detail }: WechatMiniprogram.Input) {
    const { index } = target.dataset;

    this.setData({
      [`inputs[${index}].value`]: detail.value,
    });
  },

  onStudyInput({
    target,
    detail,
  }: WechatMiniprogram.Input<Record<never, never>, { index: number }>) {
    const { index } = target.dataset;

    this.setData({
      [`study[${index}].${target.id}`]: detail.value,
    });
  },

  addStudy() {
    this.setData({ study: [...this.data.study, <UnderStudyOptions>{}] });
  },

  removeStudy({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;

    this.setData({
      study: this.data.study.filter((_, i) => i !== index),
    });
  },

  onFamilyInput({
    target,
    detail,
  }: WechatMiniprogram.Input<Record<never, never>, { index: number }>) {
    const { index } = target.dataset;

    this.setData({
      [`family[${index}].${target.id}`]: detail.value,
    });
  },

  addFamily() {
    this.setData({ family: [...this.data.family, <UnderFamilyOptions>{}] });
  },

  removeFamily({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<never, never>,
    Record<never, never>,
    { index: number }
  >) {
    const { index } = currentTarget.dataset;

    this.setData({
      family: this.data.family.filter((_, i) => i !== index),
    });
  },

  async getCreateArchiveInfo() {
    wx.showLoading({ title: "获取中" });

    try {
      const err = await (
        useOnlineService("under-login")
          ? ensureOnlineUnderSystemLogin
          : ensureUnderSystemLogin
      )(globalData.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const result = await (
        useOnlineService(PAGE_ID)
          ? getOnlineUnderStudentArchiveInfo
          : getUnderStudentArchiveInfo
      )();

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        this.setData({
          stage: "info",
          readonly: result.readonly,
          editable: result.editable.map((item) => {
            if ("options" in item) {
              const selectedIndex = Math.max(
                item.options.findIndex(
                  ({ text }) => text === item.defaultValue,
                ),
                0,
              );

              return {
                ...item,
                selectedIndex,
              };
            }

            let selectedIndex = 0;
            const categoryIndex = Math.max(
              item.values.findIndex((category) => {
                const index = category.findIndex(
                  ({ text }) => text === item.defaultValue,
                );

                if (index !== -1) selectedIndex = index;

                return index >= 0;
              }),
              0,
            );

            return {
              ...item,
              categoryIndex,
              selectedIndex,
            };
          }),
        });
        this.state.loginMethod = "check";
        this.state.infoFields = result.fields;
        this.state.infoPath = result.path;
      } else if (result.type === LoginFailType.Expired) {
        this.handleExpired(result.msg);
      } else if (result.type === "created") {
        showModal("已有学籍", result.msg, () => {
          this.$back();
        });
      } else {
        showModal("获取失败", result.msg);
      }
    } catch (msg) {
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
  },

  async submitCreateArchiveInfo() {
    const { editable } = this.data;
    const { infoFields, infoPath } = this.state;

    // check
    if (
      editable.some((item) => {
        if ("values" in item) {
          const { text, categoryIndex, values, selectedIndex } = item;

          if (!values[categoryIndex][selectedIndex]?.text) {
            showModal("信息缺失", `${text}不能留空`);

            return true;
          }

          return false;
        }

        const { text, options, selectedIndex } = item;

        if (!options[selectedIndex]?.text) {
          showModal("信息缺失", `${text}不能留空`);

          return true;
        }

        return false;
      })
    )
      return;

    wx.showLoading({ title: "提交中" });

    try {
      const err = await (
        useOnlineService("under-login")
          ? ensureOnlineUnderSystemLogin
          : ensureUnderSystemLogin
      )(globalData.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const fields = [...infoFields];
      const changedFields: string[] = [];

      editable.forEach((item) => {
        const {
          name,
          defaultValue,
          checkboxName,
          checkboxValue,
          selectedIndex,
        } = item;

        if ("values" in item) {
          const { categoryIndex, values } = item;

          if (values[categoryIndex][selectedIndex].text === item.defaultValue)
            return;

          fields.push(
            { name: checkboxName, value: checkboxValue },
            {
              name,
              value: values[categoryIndex][selectedIndex].value,
            },
          );
          changedFields.push(item.name);

          return;
        }

        const { options } = item;

        if (options[selectedIndex].text === defaultValue) return;

        fields.push(
          { name: checkboxName, value: checkboxValue },
          { name, value: options[selectedIndex].value },
        );
        changedFields.push(item.name);
      });

      fields.find(({ name }) => name === "gxstr")!.value =
        changedFields.join(",");

      const result = await (
        useOnlineService(PAGE_ID)
          ? submitOnlineUnderStudentArchiveInfo
          : submitUnderStudentArchiveInfo
      )({ fields, path: infoPath });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        this.state.addressPath = result.path;
        this.state.addressFields = result.fields;
        this.state.loginMethod = "check";
        this.setData({ stage: "address", inputs: result.inputs });
      } else if (result.type === LoginFailType.Expired) {
        this.handleExpired(result.msg);
      } else {
        showModal("提交失败", result.msg);
      }
    } catch (msg) {
      console.error(msg);
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
  },

  async submitCreateArchiveAddress() {
    const { inputs } = this.data;
    const { addressFields, addressPath } = this.state;

    if (inputs.some((item) => item.required && !item.value)) return;

    wx.showLoading({ title: "提交中" });

    try {
      const err = await (
        useOnlineService("under-login")
          ? ensureOnlineUnderSystemLogin
          : ensureUnderSystemLogin
      )(globalData.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const fields = [...addressFields];

      inputs.forEach(({ name, value }) => {
        fields.push({ name, value });
      });

      const result = await (
        useOnlineService(PAGE_ID)
          ? submitOnlineUnderStudentArchiveAddress
          : submitUnderStudentArchiveAddress
      )({ fields, path: addressPath });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        this.state.studyPath = result.path;
        this.state.studyFields = result.fields;
        this.state.loginMethod = "check";
        this.setData({ stage: "study", study: result.study });
      } else if (result.type === LoginFailType.Expired) {
        this.handleExpired(result.msg);
      } else {
        showModal("提交失败", result.msg);
      }
    } catch (msg) {
      console.error(msg);
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
  },

  async submitCreateArchiveStudy() {
    const { study } = this.data;
    const { studyPath, studyFields } = this.state;

    wx.showLoading({ title: "提交中" });

    try {
      const err = await (
        useOnlineService("under-login")
          ? ensureOnlineUnderSystemLogin
          : ensureUnderSystemLogin
      )(globalData.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const result = await (
        useOnlineService(PAGE_ID)
          ? submitOnlineUnderStudentArchiveStudy
          : submitUnderStudentArchiveStudy
      )({
        fields: studyFields,
        path: studyPath,
        study,
      });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        this.state.familyPath = result.path;
        this.state.familyFields = result.fields;
        this.state.loginMethod = "check";
        this.setData({ stage: "family", family: result.family });
      } else if (result.type === LoginFailType.Expired) {
        this.handleExpired(result.msg);
      } else {
        showModal("提交失败", result.msg);
      }
    } catch (msg) {
      console.error(msg);
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
  },

  async submitCreateArchiveFamily() {
    const { family } = this.data;
    const { familyFields, familyPath } = this.state;

    wx.showLoading({ title: "提交中" });

    try {
      const err = await (
        useOnlineService("under-login")
          ? ensureOnlineUnderSystemLogin
          : ensureUnderSystemLogin
      )(globalData.account!, this.state.loginMethod);

      if (err) throw err.msg;

      const result = await (
        useOnlineService(PAGE_ID)
          ? submitOnlineUnderStudentArchiveFamily
          : submitUnderStudentArchiveFamily
      )({
        fields: familyFields,
        path: familyPath,
        family,
      });

      wx.hideLoading();
      this.state.inited = true;

      if (result.success) {
        this.setData({ stage: "success" });
      } else if (result.type === LoginFailType.Expired) {
        this.handleExpired(result.msg);
      } else {
        showModal("提交失败", result.msg);
      }
    } catch (msg) {
      console.error(msg);
      wx.hideLoading();
      showModal("获取失败", <string>msg);
    }
  },

  handleExpired(content: string) {
    this.state.loginMethod = "login";
    retryAction("登录过期", content, () => this.getCreateArchiveInfo());
  },
});

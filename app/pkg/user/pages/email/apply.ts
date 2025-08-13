import { $Page, env, showModal, writeClipboard } from "@mptool/all";

import { appCoverPrefix, logo } from "../../../../config/index.js";
import { ActionFailType } from "../../../../service/index.js";
import { envName, info, user, windowInfo } from "../../../../state/index.js";
import { showNotice } from "../../../../utils/index.js";
import type { ApplyEmailOptions } from "../../service/index.js";
import { applyEmail, checkEmail } from "../../service/index.js";

const MAIL_LINK = "https://mail.nenu.edu.cn";
const PAGE_ID = "email-apply";
const PAGE_TITLE = "校园邮箱申请";

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    logo,

    nav: {
      title: PAGE_TITLE,
      statusBarHeight: windowInfo.statusBarHeight,
      from: "返回",
    },

    accounts: [] as string[],
    accountIndex: 0,
    /** 邮箱数字后缀 */
    suffix: "",
    /** 密保电话 */
    phone: "",

    status: "apply" as "apply" | "success" | "error" | "login",
  },

  state: {
    accounts: [] as { display: string; key: string }[],
  },

  onShow() {
    if (user.account) {
      this.setData({ status: "apply" });
      this.checkEmail();
    } else {
      this.setData({ status: "login" });
    }

    showNotice(PAGE_ID);
  },

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  onPageScroll() {},

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}Share.png`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  input({ currentTarget, detail }: WechatMiniprogram.Input) {
    const { id } = currentTarget;
    const { value } = detail;

    this.setData({ [id]: value });
  },

  picker({ detail }: WechatMiniprogram.PickerChange) {
    const accountIndex = Number(detail.value);

    this.setData({ accountIndex });
  },

  async checkEmail() {
    wx.showLoading({ title: "加载中" });

    const result = await checkEmail({
      type: "init",
      id: user.info!.id,
    });

    wx.hideLoading();

    if (!result.success) {
      this.setData({
        status: "error",
        errMsg:
          result.type === ActionFailType.Existed
            ? `您已有我校邮箱 ${result.msg}，不能重复申请`
            : result.msg,
      });

      return;
    }

    this.setData({
      accounts: ["请选择", ...result.data.map(({ display }) => display)],
    });
    this.state.accounts = result.data;
  },

  applyEmail() {
    const { accounts, accountIndex, suffix, phone } = this.data;
    const { info } = user;

    if (!info) {
      showModal(
        "个人信息缺失",
        `${envName}本地暂无个人信息，请重新登录`,
        () => {
          this.$go(`account-login?update=true`);
        },
      );

      return;
    }

    if (accountIndex === 0 || accountIndex === accounts.length - 1) {
      showModal("未选择邮箱名称", "请选择一个合适的邮箱名称");

      return;
    }
    if (suffix) {
      const suffixNumber = Number(suffix);

      if (
        Number.isNaN(suffixNumber) ||
        suffixNumber < 100 ||
        suffixNumber > 999 ||
        Math.floor(suffixNumber) !== suffixNumber
      ) {
        showModal("后缀设置有误", "请设置一个 100 到 999 之间的三位数字");

        return;
      }
    }

    if (!/^1\d{10}$/.test(phone)) {
      showModal("手机号码有误", "请输入正确的 11 位手机号码。");

      return;
    }

    const options: ApplyEmailOptions = {
      type: "apply",
      account: this.state.accounts[accountIndex - 1].key,
      suffix: suffix ?? "",
      phone,
      id: user.info!.id,
    };

    showModal(
      "信息确认",
      `\
您正在申请我校邮箱。
账号: ${options.account}${options.suffix || ""}@nenu.edu.cn
密保手机: ${phone}
`,
      () => {
        wx.showLoading({ title: "申请中" });

        applyEmail(options).then((result) => {
          wx.hideLoading();

          if (result.success) this.setData({ status: "success", result });
          else showModal("申请邮箱失败", result.msg);
        });
      },
      () => {
        // do nothing
      },
    );
  },

  initEmail() {
    if (env === "donut") this.$go(`web?url=${encodeURIComponent(MAIL_LINK)}`);
    else {
      writeClipboard(MAIL_LINK).then(() =>
        showModal(
          "网址已复制",
          `小程序暂不支持打开网页，请手动粘贴到浏览器地址栏并访问。`,
        ),
      );
    }
  },

  retry() {
    return this.checkEmail();
  },
});

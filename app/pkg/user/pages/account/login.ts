import { $Page, retry, showModal, showToast } from "@mptool/all";

import type { ListComponentConfig } from "../../../../../typings/components.js";
import { appCoverPrefix, logo } from "../../../../config/index.js";
import { ActionFailType, mpRemove } from "../../../../service/index.js";
import type { UserInfo } from "../../../../state/index.js";
import {
  env,
  envName,
  info,
  setUserInfo,
  user,
  windowInfo,
} from "../../../../state/index.js";
import {
  getLicenseStatus,
  logout,
  showNotice,
} from "../../../../utils/index.js";
import type { AuthCaptchaInfo } from "../../service/index.js";
import {
  authInit,
  checkIdCode,
  generateIdCode,
  getAuthCaptcha,
  getAuthInitInfo,
  sendReAuthSMS,
  verifyAuthCaptcha,
  verifyReAuthCaptcha,
} from "../../service/index.js";

const PAGE_ID = "account-login";
const PAGE_TITLE = "统一身份认证信息";

const EMPTY_CONTENT = [{ text: "暂无个人信息" }];

const FOOTER = `
『登录说明』
${envName}需自动完成登录以提供基于账户的功能。您可能需要在以下情况时进行额外操作:
1. ${envName}的不同功能可能基于不同系统，需要同时保持多处登录。为正常使用${envName}您必须关闭「单处登录」功能，如您已开启请前往统一身份认证官网关闭。
2. 账户登录失败次数过多或异地登录时将无法自动登录，此时您需要重新登录并填写验证码。

『隐私说明』
Mr.Hope 会严格遵守隐私协议的要求。您的账号密码将仅存储在本地，Mr.Hope 不会收集或存储。
您可在登录后的任何时候点击【注销并删除信息】按钮。当你这样做时，Mr.Hope 将会删除${envName}本地和服务器上有关于你的全部信息。
`;

$Page(PAGE_ID, {
  data: {
    theme: info.theme,
    env,
    logo,

    /** 导航栏 */
    nav: {
      title: PAGE_TITLE,
      statusBarHeight: windowInfo.statusBarHeight,
      from: "返回",
    },

    list: {
      header: false,
      items: EMPTY_CONTENT,
    } as ListComponentConfig,

    footer: {
      desc: FOOTER,
    },

    id: "",
    password: "",

    distance: 0,
    sliderWidth: 45,

    smsCode: "",

    remark: "",
    refresh: false,
    idCodeHintMsg: `\
为了保障用户信息安全：
1. 只有登录用户才能扫描身份码。
2. 每个身份码只能被核验一次。
3. 用户只能在最后的登录的设备上生成和核验身份码。
4. 每个用户只能存在一个有效身份码，并可以随时强制生成新的身份码。\
`,

    info: null as UserInfo | null,

    isSaved: false,
    showPassword: false,
    showReAuth: false,
    accept: false,
  },

  state: {
    authToken: "",
    shouldNavigateBack: false,
    initId: null as string | null,
    params: {} as Record<string, string>,
    salt: "",
    touchPosition: 0,
  },

  onLoad(options) {
    const { account, info } = user;
    const from = options.from ?? "返回";
    const scene = decodeURIComponent(options.scene ?? "");

    if (account)
      this.setData({
        id: account.id.toString(),
        password: account.password,
        isSaved: true,
        isAdmin: wx.getStorageSync<boolean>("isAdmin"),
      });

    if (info) this.setData({ info });
    if (options.update) this.state.shouldNavigateBack = true;
    if (scene.startsWith("verify:")) this.verifyIDCode(scene.substring(7));

    this.setData({
      // eslint-disable-next-line @typescript-eslint/naming-convention
      "nav.from": from,
    });
  },

  onShow() {
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

    this.setData({ [id]: value }, () => {
      if (id === "id" && value.length === 10) this.getInitInfo();
    });
  },

  togglePassword() {
    this.setData({ showPassword: !this.data.showPassword });
  },

  onSliderMove({ currentTarget, type, touches }: WechatMiniprogram.Touch) {
    switch (type) {
      case "touchstart":
        this.state.touchPosition = touches[0].pageX - currentTarget.offsetLeft;
        break;
      case "touchmove": {
        const distance = touches[0].pageX - this.state.touchPosition;

        this.setData({
          distance: Math.max(
            0,
            Math.min(distance, 295 - this.data.sliderWidth / 2),
          ),
        });
        break;
      }
      case "touchend": {
        // reset state
        this.state.touchPosition = 0;
        // verify captcha
        this.verifyCaptcha();
      }
    }
  },

  setCaptchaInfo({ slider, bg, sliderWidth, offsetY }: AuthCaptchaInfo) {
    this.setData({
      captchaBg: bg,
      captchaSlider: slider,
      sliderOffsetY: offsetY,
      sliderWidth,
    });
  },

  async getInitInfo() {
    const { id } = this.data;

    if (id.length !== 10) return;

    const result = await getAuthInitInfo(id);

    if (!result.success) return showModal("初始化失败", result.msg);

    const { params, salt, needCaptcha, captcha } = result;

    this.state.initId = id;
    this.state.params = params;
    this.state.salt = salt;

    if (needCaptcha) {
      if (!captcha.success)
        return retry("初始化失败", "获取图形验证码失败。", () => {
          this.getAuthCaptcha();
        });

      return this.setCaptchaInfo(captcha.data);
    }
  },

  async getAuthCaptcha() {
    const result = await getAuthCaptcha(this.data.id);

    if (!result.success)
      return showModal("获取失败", "拼图验证码获取失败", () => {
        this.getAuthCaptcha();
      });

    return this.setCaptchaInfo(result.data);
  },

  async verifyCaptcha() {
    const result = await verifyAuthCaptcha(this.data.distance);

    // clear captcha
    this.setData({ captchaBg: "", distance: 0 });

    if (!result.success) {
      retry("验证失败", "请正确拼合图像。", () => {
        this.getAuthCaptcha();
      });
    }

    return showModal("验证成功", "请继续登录");
  },

  acceptLicense() {
    this.setData({ accept: !this.data.accept });
  },

  async init() {
    const { id, password, accept } = this.data;
    const { authToken } = this.state;

    if (id.length !== 10 || !password)
      return wx.showToast({ title: "请输入完整信息", icon: "error" });

    if (!accept)
      return wx.showToast({ title: "请同意用户协议", icon: "error" });

    const { initId, params, salt } = this.state;

    if (initId !== id)
      return showModal(
        "初始化中",
        "尚未完成登录信息拉取，请 3 秒重试。如果此提示重复出现，请重新输入学号。",
      );

    wx.showLoading({ title: "验证中" });

    // 设置协议版本
    wx.setStorageSync("license", (await getLicenseStatus()).version);

    const result = await authInit({
      id: Number(id),
      password,
      authToken,
      params,
      salt,
      openid: user.openid!,
    });

    wx.hideLoading();

    if (!result.success) {
      if (result.type === ActionFailType.NeedReAuth) return this.startReAuth();

      showModal("登录失败", result.msg);
      this.state.initId = null;

      return this.getInitInfo();
    }

    if (!result.info) {
      this.state.initId = null;

      return showModal(
        "登录失败",
        "账号密码校验成功，但未能成功获取账号信息。这通常是学校系统出错，请稍后重试。",
      );
    }

    showModal("登录成功", "您已成功登录");

    setUserInfo({ id: Number(id), password, authToken }, result.info);

    if (this.state.shouldNavigateBack) return this.$back();

    return this.setData({
      isSaved: true,
      info: result.info,
    });
  },

  async startReAuth() {
    const result = await sendReAuthSMS(this.data.id);

    if (result.success) {
      showModal("需要二次验证", "短信验证码已发送，请注意查收。");

      return this.setData({
        showReAuth: true,
        hiddenCellphone: result.data.hiddenCellphone,
      });
    }

    if (result.type === ActionFailType.TooFrequent) {
      showModal(
        "已发送验证码",
        `两分钟内已下发过短信验证码，重新发送需等待 ${result.codeTime} 秒。`,
      );

      return this.setData({ showReAuth: true });
    }

    return showModal("发送失败", result.msg);
  },

  async verifyReAuth() {
    const { smsCode } = this.data;

    if (!smsCode) return showToast("请输入验证码");

    const result = await verifyReAuthCaptcha(smsCode);

    this.setData({ smsCode: "" });

    if (!result.success) {
      return showModal("验证失败", result.msg);
    }

    this.setData({ showReAuth: false });
    this.state.authToken = result.authToken;

    return this.init();
  },

  cancelReAuth() {
    this.setData({ showReAuth: false, smsCode: "" });
  },

  reset() {
    showModal("暂不支持", "请前往官网 authserver.nenu.edu.cn 按引导操作。");
  },

  async checkIdCode() {
    wx.showLoading({ title: "获取中" });

    const result = await checkIdCode<void>();

    wx.hideLoading();

    if (!result.success) return showModal("获取失败", result.msg);

    if (result.data.existed) {
      const { code, remark } = result.data;

      return wx.showModal({
        title: "已存在身份码",
        content: `已存在未核验的身份码，用途为：${remark}`,
        confirmText: "重新生成",
        cancelText: "显示当前",
        success: ({ confirm, cancel }) => {
          if (confirm) {
            this.setData({ refresh: true });
            this.showIdCodeHint();
          } else if (cancel) {
            this.setData({ idCode: code });
          }
        },
      });
    }

    if (result.data.verifier)
      return showModal(
        "已核验身份码",
        `先前生成的身份码已被核验。\n核验信息：${result.data.verifier}`,
        () => {
          this.showIdCodeHint();
        },
      );

    this.showIdCodeHint();
  },

  showIdCodeHint() {
    this.setData({ idCodeHint: true });
  },

  async getIdCode(force = false) {
    const { remark } = this.data;

    if (!remark) return showModal("未填写用途", "请必须准确描述生成用途。");

    wx.showLoading({ title: "生成中" });

    const result = await generateIdCode(remark, force);

    wx.hideLoading();

    if (!result.success)
      return retry("生成失败", result.msg, () => {
        this.getIdCode(force);
      });

    this.setData({
      idCodeHint: false,
      idCode: result.data.code,
    });
  },

  generateIdCode() {
    this.getIdCode();
  },

  refreshIdCode() {
    this.getIdCode(true);
  },

  cancelIdCode() {
    this.setData({ idCodeHint: false });
  },

  async verifyIDCode(uuid: string) {
    wx.showLoading({ title: "验证中" });

    const result = await checkIdCode(uuid);

    wx.hideLoading();

    if (!result.success) return showModal("验证失败", result.msg);

    const { createTime, ...info } = result.data;

    this.setData({
      idCodeInfo: {
        ...info,
        createTime: new Date(createTime).toLocaleString("zh"),
      },
    });
  },

  closeIdCode() {
    this.setData({ idCode: null });
  },

  completeVerify() {
    this.setData({ idCodeInfo: null });
  },

  logout() {
    showModal(
      "退出登录",
      "确认退出登录? ",
      () => {
        logout();
        this.setData({
          id: "",
          password: "",
          info: null,
          isSaved: false,
        });
      },
      () => {
        // do nothing
      },
    );
  },

  unregister() {
    showModal(
      "注销账号",
      `确认注销账号? 这会删除${envName}上和你相关的全部数据且无法恢复！`,
      async () => {
        const result = await mpRemove();

        logout();
        this.setData({
          id: "",
          password: "",
          info: null,
          isSaved: false,
        });

        if (result.success) {
          showModal("注销成功", "已删除本地和服务器上的全部账号数据信息。");
        } else
          showModal(
            "已请求注销",
            "已删除本地的账号数据信息，服务器上的数据将在稍后删除",
          );
      },
      () => {
        // do nothing
      },
    );
  },
});

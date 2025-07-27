import {
  $Page,
  env,
  savePhoto,
  showModal,
  showToast,
  writeClipboard,
} from "@mptool/all";

import type {
  QQAccounts,
  WechatAccounts,
} from "../../../../../typings/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import { windowInfo } from "../../../../state/index.js";
import {
  ensureJson,
  getAssetLink,
  getJson,
  showNotice,
  showOfficialQRCode,
  tryOpenOfficialProfile,
} from "../../../../utils/index.js";

type AccountType = "qq" | "wx";

const PAGE_ID = "school-media";
const PAGE_TITLE = "校园媒体";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    config: [] as unknown[],

    env,
    type: env,

    footer: {
      desc: "校园媒体入驻，请联系 Mr.Hope",
    },
  },

  onNavigate() {
    ensureJson(`function/account/${env}`);
  },

  onLoad({ type }: { type: AccountType }) {
    const defaultType = type || "wx";

    getJson<QQAccounts | WechatAccounts>(
      `function/account/${defaultType}`,
    ).then((config) => {
      this.setData({
        config: config.map(({ name, account }) => ({
          name,
          account: account.map((item) => ({
            ...item,
            logo: getAssetLink(item.logo),
            ...("qrcode" in item ? { qrcode: getAssetLink(item.qrcode) } : {}),
          })),
        })),
        type: defaultType,
        height: windowInfo.windowHeight - windowInfo.statusBarHeight - 202,
      });
    });

    showNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({ title: PAGE_TITLE }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - windowInfo.statusBarHeight - 202,
    });
  },

  switch({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { type: AccountType }
  >) {
    const { type } = currentTarget.dataset;

    getJson<unknown[]>(`function/account/${type}`).then((config) => {
      this.setData({ config, type });
    });
  },

  showWechat(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      {
        item: {
          name: string;
          desc: string;
          logo: string;
          id: string;
          path?: string;
        };
      }
    >,
  ) {
    const { item } = event.currentTarget.dataset;

    tryOpenOfficialProfile(item.id, () => {
      if (item.path) this.$go("wechat?from=校园媒体&path=" + item.path);
      else showOfficialQRCode(item.id);
    });
  },

  showQQ(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { id: number; qrcode?: string }
    >,
  ) {
    const { id, qrcode } = event.currentTarget.dataset;

    if (qrcode)
      savePhoto(qrcode)
        .then(() => showToast("二维码已保存至相册"))
        .catch(() => showToast("二维码下载失败"));
    else
      writeClipboard(id.toString()).then(() => {
        showModal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
      });
  },
});

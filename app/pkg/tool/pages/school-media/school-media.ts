import { $Page } from "@mptool/all";

import {
  copyContent,
  savePhoto,
  showModal,
  showToast,
} from "../../../../api/index.js";
import { appCoverPrefix } from "../../../../config/index.js";
import type { Env } from "../../../../state/index.js";
import { env, info } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "school-media";
const PAGE_TITLE = "校园媒体";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    config: [] as unknown[],

    type: env,

    footer: {
      desc: "校园媒体入驻，请联系 Mr.Hope",
    },
  },

  onNavigate() {
    ensureJson(`function/account/${env}`);
  },

  onLoad({ type = env }: { type: Env }) {
    getJson<unknown[]>(`function/account/${type}`).then((config) => {
      this.setData({
        config,
        type,
        height: info.screenHeight - info.statusBarHeight - 202,
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

  onResize() {
    this.setData({
      height: info.screenHeight - info.statusBarHeight - 202,
    });
  },

  switch({
    currentTarget,
  }: WechatMiniprogram.TouchEvent<
    Record<string, never>,
    Record<string, never>,
    { type: Env }
  >) {
    const { type } = currentTarget.dataset;

    getJson<unknown[]>(`function/account/${type}`).then((config) => {
      this.setData({ config, type });
    });
  },

  detail(
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
      copyContent(id.toString()).then(() => {
        showModal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
      });
  },
});

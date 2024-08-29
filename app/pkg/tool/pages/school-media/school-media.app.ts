import {
  $Page,
  savePhoto,
  showModal,
  showToast,
  writeClipboard,
} from "@mptool/all";

import type { Env } from "../../../../state/index.js";
import { env, info } from "../../../../state/index.js";
import { ensureJson, getJson, showNotice } from "../../../../utils/index.js";

const PAGE_ID = "school-media";

$Page(PAGE_ID, {
  data: {
    config: [] as unknown[],

    type: env,

    footer: {
      desc: "校园媒体入驻，请联系 Mr.Hope",
    },
  },

  onNavigate() {
    ensureJson(`function/account/${env}`);
  },

  onLoad({ type }: { type: Env }) {
    const res = type || (env === "qq" ? "qq" : "wx");

    getJson<unknown[]>(`function/account/${res}`).then((config) => {
      this.setData({
        config,
        type: res,
        height: info.windowHeight - info.statusBarHeight - 202,
      });
    });

    showNotice(PAGE_ID);
  },

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - info.statusBarHeight - 202,
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
      writeClipboard(id.toString()).then(() => {
        showModal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
      });
  },
});

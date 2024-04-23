import { $Page } from "@mptool/all";

import {
  savePhoto,
  setClipboard,
  showModal,
  showToast,
} from "../../api/index.js";
import type { Env } from "../../state/info.js";
import { info } from "../../state/info.js";
import { ensureResource, getResource } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { env } = info;
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
    ensureResource(`function/account/${env}`);
  },

  onLoad({ type }: { type: Env }) {
    const res = type || (env === "qq" ? "qq" : "wx");

    getResource<unknown[]>(`function/account/${res}`).then((config) => {
      this.setData({
        config,
        type: res,
        height: info.windowHeight - info.statusBarHeight - 202,
      });
    });

    popNotice(PAGE_ID);
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

    getResource<unknown[]>(`function/account/${type}`).then((config) => {
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
      setClipboard(id.toString()).then(() => {
        showModal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
      });
  },
});

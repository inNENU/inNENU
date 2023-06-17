import { $Page } from "@mptool/enhance";

import { type AppOption } from "../../app.js";
import { getWindowInfo, modal, savePhoto, tip } from "../../utils/api.js";
import { type Env } from "../../utils/app.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";

const { globalData } = getApp<AppOption>();
const { env } = globalData;
const PAGE_ID = "school-media";

$Page(PAGE_ID, {
  data: {
    config: <unknown[]>[],

    type: globalData.env,

    footer: {
      desc: "校园媒体入驻，请联系 Mr.Hope",
    },
  },

  onNavigate() {
    ensureJSON(`function/account/${env}`);
  },

  onLoad({ type }: { type: Env }) {
    const res = type || (env === "qq" ? "qq" : "wx");

    getJSON<unknown[]>(`function/account/${res}`).then((config) => {
      const info = getWindowInfo();

      this.setData({
        config,
        type: res,
        height: info.windowHeight - info.statusBarHeight - 229,
      });
    });

    popNotice(PAGE_ID);
  },

  onResize({ size }) {
    this.setData({
      height: size.windowHeight - globalData.info.statusBarHeight - 229,
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

    getJSON<unknown[]>(`function/account/${type}`).then((config) => {
      this.setData({ config, type });
    });
  },

  detail(
    event: WechatMiniprogram.TouchEvent<
      Record<string, never>,
      Record<string, never>,
      { id: number; qrcode?: string }
    >
  ) {
    const { id, qrcode } = event.currentTarget.dataset;

    if (qrcode)
      savePhoto(qrcode, true)
        .then(() => tip("二维码已保存至相册"))
        .catch(() => tip("二维码下载失败"));
    else
      wx.setClipboardData({
        data: id.toString(),
        success: () => {
          modal("复制成功", "由于暂无二维码，QQ号已复制至您的剪切板");
        },
      });
  },
});

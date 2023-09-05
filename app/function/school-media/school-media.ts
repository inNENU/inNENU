import { $Page } from "@mptool/all";

import {
  savePhoto,
  setClipboard,
  showModal,
  showToast,
} from "../../api/index.js";
import type { AppOption } from "../../app.js";
import { appCoverPrefix } from "../../config/index.js";
import { ensureJSON, getJSON } from "../../utils/json.js";
import { popNotice } from "../../utils/page.js";
import type { Env } from "../../utils/typings.js";

const { globalData } = getApp<AppOption>();
const { env } = globalData;

const PAGE_ID = "school-media";
const PAGE_TITLE = "校园媒体";

$Page(PAGE_ID, {
  data: {
    title: PAGE_TITLE,

    config: <unknown[]>[],

    type: globalData.env,

    footer: {
      desc: "校园媒体入驻，请联系 Mr.Hope",
    },
  },

  onNavigate() {
    ensureJSON(`function/account/${env}`);
  },

  onLoad({ type = env }: { type: Env }) {
    getJSON<unknown[]>(`function/account/${type}`).then((config) => {
      this.setData({
        config,
        type,
        height:
          globalData.info.screenHeight - globalData.info.statusBarHeight - 202,
      });
    });

    popNotice(PAGE_ID);
  },

  onShareAppMessage: () => ({
    title: PAGE_TITLE,
    path: `/function/school-media/school-media`,
  }),

  onShareTimeline: () => ({ title: PAGE_TITLE }),

  onAddToFavorites: () => ({
    title: PAGE_TITLE,
    imageUrl: `${appCoverPrefix}.jpg`,
  }),

  onResize() {
    this.setData({
      height:
        globalData.info.screenHeight - globalData.info.statusBarHeight - 202,
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

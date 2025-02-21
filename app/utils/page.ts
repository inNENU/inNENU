import type { PageInstance, PageQuery } from "@mptool/all";
import {
  go,
  logger,
  readJSON,
  showModal,
  writeClipboard,
  writeJSON,
} from "@mptool/all";

import { getAssetLink } from "./getLink.js";
import { getScopeData } from "./getScopeData.js";
import { id2path } from "./id.js";
import { ensureJson } from "./json.js";
import type {
  ComponentConfig,
  FunctionalListComponentItemConfig,
  GridComponentItemOptions,
  ListComponentItemOptions,
  PageOptions,
  PageState,
  PageStateWithContent,
} from "../../typings/index.js";
import { requestJSON } from "../api/index.js";
import type { NoticeItem } from "../app/index.js";
import type { App } from "../app.js";
import { imageWaterMark } from "../config/index.js";
import { appInfo, env, info } from "../state/index.js";

type PageInstanceWithPage = PageInstance<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any> & { page?: PageState },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any>
>;

/**
 * 处理详情内容
 *
 * @param element 列表的内容
 * @param page 页面内容
 */
const setListItemState = (
  listElement:
    | FunctionalListComponentItemConfig
    | GridComponentItemOptions
    | ListComponentItemOptions,
):
  | (
      | FunctionalListComponentItemConfig
      | GridComponentItemOptions
      | ListComponentItemOptions
    )
  | null => {
  if ("env" in listElement && listElement.env && !listElement.env.includes(env))
    return null;

  if ("type" in listElement)
    if (listElement.type === "switch")
      // 设置列表开关与滑块
      listElement.status =
        wx.getStorageSync<boolean | undefined>(listElement.key) || false;
    else if (listElement.type === "slider")
      listElement.value = wx.getStorageSync(listElement.key);
    // 设置列表选择器
    else if (listElement.type === "picker")
      if (listElement.single) {
        // 单列选择器
        const selectIndex = wx.getStorageSync<number>(listElement.key);

        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        listElement.value = listElement.select[selectIndex];
        listElement.currentValue = [selectIndex];
      } else {
        // 多列选择器
        const selectIndexes: string[] = wx
          .getStorageSync<string>(listElement.key)
          .split("-");

        listElement.currentValue = [];
        listElement.value = [];
        selectIndexes.forEach((pickerElement, index) => {
          (listElement.value as unknown[])[index] = (
            listElement.select[index] as unknown[]
          )[Number(pickerElement)];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (listElement.currentValue as any[])[index] = Number(pickerElement);
        });
      }

  return listElement;
};

export const setComponentState = (
  components: ComponentConfig[],
  images: string[] = [],
): ComponentConfig[] =>
  components
    .map((component) => {
      const { tag } = component;

      // 设置隐藏
      if ("env" in component && !component.env?.includes(env)) return null;

      if (tag === "img") {
        const { src, watermark } = component;

        images.push(`${getAssetLink(src)}${watermark ? imageWaterMark : ""}`);
      }

      // 设置 list 组件
      if (tag === "list" || tag === "grid" || tag === "functional-list")
        component.items = component.items
          .map(
            (
              listElement:
                | FunctionalListComponentItemConfig
                | GridComponentItemOptions
                | ListComponentItemOptions,
            ) => setListItemState(listElement),
          )
          .filter((listElement) => listElement !== null);

      return component;
    })
    .filter((component) => component !== null);

/**
 * 获得界面数据，生成正确的界面数据
 *
 * @param page 页面数据
 * @param option 页面传参
 *
 * @returns 处理之后的page
 */
const setPageState = (
  page: PageState | PageStateWithContent,
  option: PageOptions,
): PageState => {
  // 设置界面名称
  page.id = option.id || page.title;
  // 设置页面来源
  page.from = option.from || "返回";

  if (page.content) {
    page.content = setComponentState(page.content, (page.images ??= []));
    page.scopeData = getScopeData(page as PageStateWithContent);
  }

  // 调试

  logger.debug(`Resolve ${page.id} page success`);

  // 返回处理后的 page
  return page;
};

/**
 * 提前获得子界面。在界面加载完毕时，检查界面包含的所有链接是否已存在本地 json，如果没有立即获取并处理后写入存储
 *
 * @param page 页面数据
 */
const preloadPageLinks = (page: PageState): void => {
  if (page.content)
    page.content.forEach((component) => {
      const { tag } = component;

      if (
        "items" in component &&
        (tag === "list" || tag === "grid" || tag === "functional-list")
      )
        // 该组件是列表或九宫格，需要预加载界面，提前获取界面到存储
        component.items.forEach(
          (
            element: (
              | FunctionalListComponentItemConfig
              | GridComponentItemOptions
              | ListComponentItemOptions
            ) & { hidden?: boolean },
          ) => {
            if ("path" in element && element.path) ensureJson(element.path);
          },
        );
    });
  else logger.warn("页面为空");
};

/**
 * **简介:**
 *
 * - 描述: 预处理页面数据写入全局数据
 *
 * - 用法: 在页面 `onNavigate` 时调用
 *
 * - 性质: 同步函数
 *
 * @param options 页面跳转参数
 * @param page page 数组
 * @param setGlobal 是否将处理后的数据写入到全局数据中
 *
 * @returns 处理后的 page 配置
 *
 * **案例:**
 *
 * ```ts
 *   onNavigate(option) {
 *     resolvePage(option);
 *   }
 * ```
 */
export const resolvePage = (
  options: PageQuery,
  page?: PageState,
  setGlobal = true,
): PageState | null => {
  // 控制台输出参数
  logger.debug("Handling page:", options);

  let pageData = null;

  if (page) {
    pageData = setPageState(page, options);
  } else if (options.id) {
    const pageContent = readJSON<PageState>(options.id);

    if (pageContent) pageData = setPageState(pageContent, options);
    else logger.warn(`无法处理 ${options.id} 因为暂无数据`);
  }

  if (pageData && setGlobal) {
    const { globalData } = getApp<App>();

    // 写入 globalData
    globalData.page.id = options.id || pageData.title;
    globalData.page.data = pageData;
  }

  return pageData;
};

export interface PageColors {
  bgColor: string;
  bgColorTop: string;
  bgColorBottom: string;
}

/**
 * **简介:**
 *
 * - 描述: 设置胶囊与背景颜色
 *
 * - 用法: 在页面 `onShow` 时调用
 *
 * - 性质: 同步函数
 *
 * @param grey 页面是否为灰色背景
 *
 * @returns 页面实际的胶囊与背景颜色
 */
export const getPageColor = (grey = false): PageColors => {
  let temp: [string, string, string];

  if (appInfo.darkmode) {
    if (grey)
      switch (info.theme) {
        case "Android":
          temp = ["#10110b", "#10110b", "#10110b"];
          break;
        case "ios":
          temp = ["#000000", "#000000", "#000000"];
          break;
        case "nenu":
        default:
          temp = ["#070707", "#070707", "#070707"];
      }
    else
      switch (info.theme) {
        case "ios":
        case "Android":
        case "nenu":
        default:
          temp = ["#000000", "#000000", "#000000"];
      }
  } else if (grey)
    switch (info.theme) {
      case "Android":
        temp = ["#f8f8f8", "#f8f8f8", "#f8f8f8"];
        break;
      case "nenu":
        temp = ["#f0f0f0", "#f0f0f0", "#f0f0f0"];
        break;
      case "ios":
      default:
        temp = ["#f4f4f4", "#efeef4", "#efeef4"];
    }
  else
    switch (info.theme) {
      case "Android":
        temp = ["#f8f8f8", "#f8f8f8", "#f8f8f8"];
        break;
      case "nenu":
        temp = ["#ffffff", "#ffffff", "#ffffff"];
        break;
      case "ios":
      default:
        temp = ["#f4f4f4", "#ffffff", "#ffffff"];
    }

  return {
    bgColorTop: temp[0],
    bgColor: temp[1],
    bgColorBottom: temp[2],
  };
};

interface SetPageOptions {
  option: PageOptions;
  ctx: PageInstanceWithPage;
  handle?: boolean;
}

/**
 *  **简介:**
 *
 * - 描述: 设置本地界面数据，如果传入 `page` 参数，则根据 `handle` 的值决定是否在 `setData` 前处理 `page`。
 *
 *   如果没有传入 `page`，则使用 `PageOption.data.page`。之后根据 `preload` 的值决定是否对页面链接进行预加载。
 *
 * - 用法: 在页面 `onLoad` 时调用
 *
 * - 性质: 同步函数
 *
 * @param object 配置对象
 * - option 页面传参
 * - ctx 页面指针
 * - handle 页面是否已经被处理
 * @param page 页面数据
 * @param preload 是否预加载子页面
 */
export const setPage = (
  { option, ctx, handle = false }: SetPageOptions,
  page?: PageState,
  preload = true,
): Promise<void> =>
  new Promise((resolve) => {
    const { globalData } = getApp<App>();

    // 设置页面数据
    if (page) {
      const pageData = handle ? page : setPageState(page, option);

      ctx.setData(
        {
          color: getPageColor(pageData.grey),
          theme: info.theme,
          darkmode: appInfo.darkmode,
          page: pageData,
        },
        () => {
          logger.debug(`${pageData.id || "Unknown"} pageData is set`);
          resolve();
        },
      );
    }
    // 页面已经预处理完毕，立即写入 page 并执行本界面的预加载
    else if (
      (option.id && globalData.page.id === option.id) ||
      (ctx.data.page?.title && globalData.page.id === ctx.data.page.title)
    ) {
      const { id } = globalData.page;

      logger.debug(`${id} has been resolved`);
      ctx.setData(
        {
          color: getPageColor(globalData.page.data?.grey),
          theme: info.theme,
          darkmode: appInfo.darkmode,
          page: globalData.page.data,
        },
        () => {
          logger.debug(`${id} pageData is set`);
          if (preload) {
            preloadPageLinks(ctx.data.page!);
            logger.debug(`Preloaded ${id} links`);
          }
          resolve();
        },
      );
    } else if (ctx.data.page) {
      logger.debug(`${option.id || "Unknown"} not resolved`);

      const pageData: PageState = handle
        ? ctx.data.page
        : setPageState(ctx.data.page, option);

      // 设置页面数据
      ctx.setData(
        {
          color: getPageColor(pageData.grey),
          theme: info.theme,
          darkmode: appInfo.darkmode,
          page: pageData,
        },
        resolve,
      );
    }
  });

/**
 * **简介:**
 *
 * - 描述: 弹出通知
 *
 * - 用法: 在页面 `onLoad` 时调用
 *
 * - 性质: 同步函数
 *
 * @param id 当前界面的标识符
 */
export const showNotice = (id: string): void => {
  if (!wx.getStorageSync(`${id}-notifyed`)) {
    // 没有进行过通知，判断是否需要弹窗，从存储中获取通知内容并展示
    const notice = wx.getStorageSync<NoticeItem | undefined>(`${id}-notice`);

    if (notice) {
      showModal(notice.title, notice.content, () => {
        // 防止二次弹窗
        wx.setStorageSync(`${id}-notifyed`, true);
      });

      // 调试
      logger.debug(`Pop notice in ${id} page`);
    }
  }
};

/**
 * **简介:**
 *
 * - 描述: 设置在线界面数据
 *
 * - 用法: 在页面 `onLoad` 时调用
 *
 * - 性质: 同步函数
 *
 * @param option 页面传参
 * @param ctx 页面指针
 * @param preload 是否需要预加载(默认需要)
 */
export const setOnlinePage = (
  option: PageOptions,
  ctx: PageInstanceWithPage,
  preload = true,
): void => {
  const { globalData } = getApp<App>();
  const { id } = option;

  if (id)
    if (globalData.page.id === id) {
      // 页面已经预处理完毕，立即写入 page 并执行本界面的预加载
      logger.debug(`${id} has been resolved`);

      ctx.setData(
        {
          color: getPageColor(globalData.page.data!.grey),
          theme: info.theme,
          darkmode: appInfo.darkmode,
          page: globalData.page.data,
        },
        () => {
          logger.debug(`${id} pageData is set`);
          showNotice(id);

          if (preload) {
            preloadPageLinks(ctx.data.page!);
            logger.debug(`Preloaded ${id} links`);
          }
        },
      );
    } else {
      // 需要重新载入界面
      logger.debug(`${id} onLoad with options: `, option);

      const page = readJSON<PageState>(id);

      // 如果本地存储中含有 page 直接处理
      if (page) {
        setPage({ option, ctx }, page);
        showNotice(id);
        logger.debug(`${id} onLoad success: `, ctx.data);

        // 如果需要执行预加载，则执行
        if (preload) {
          preloadPageLinks(ctx.data.page!);
          logger.debug(`${id} preload complete`);
        }
      }
      // 请求页面Json
      else {
        requestJSON<PageState>(id)
          .then((data) => {
            // 非分享界面下将页面数据写入存储
            if (option.from !== "share") writeJSON(id, data);

            // 设置界面
            setPage({ option, ctx }, data);

            // 如果需要执行预加载，则执行
            if (preload) {
              preloadPageLinks(ctx.data.page!);
              logger.debug(`Preload ${id} complete`);
            }

            // 弹出通知
            showNotice(id);

            // 调试
            logger.debug(`${id} onLoad Succeed`);
          })
          .catch((err: unknown) => {
            // 设置 error 页面并弹出通知
            setPage(
              { option, ctx },
              {
                error: true,
                id: option.id,
                from: option.from,
              },
            );
            showNotice(option.id || "");

            // 调试
            logger.error(`页面 ${id} 加载失败`, err);
          });
      }
    }
  else logger.error("无页面 ID");
};

/**
 * **简介:**
 *
 * - 描述: 载入在线界面数据
 *
 * - 用法: 在页面 `onLoad` 时调用
 *
 * - 性质: 同步函数
 *
 * @param option 页面传参
 * @param ctx 页面指针
 * @param preload 是否需要预加载(默认需要)
 */
export const loadOnlinePage = (
  option: PageOptions & { path: string },
  ctx: PageInstanceWithPage,
): void => {
  if (option.path) {
    option.id = id2path(option.path);

    logger.debug(`${option.path} onLoad starts with options:`, option);

    // 需要在线获取界面
    requestJSON<PageState>(option.id)
      .then((page) => {
        if (page) {
          setPage({ option, ctx }, page);
          showNotice(option.path);
          logger.debug(`${option.path} onLoad succeed:`, ctx.data);
        }
      })
      .catch((errMsg: unknown) => {
        // 设置 error 页面并弹出通知
        setPage(
          { option, ctx },
          {
            error: true,
            id: option.id,
            from: option.from,
          },
        );
        showNotice(option.id || "");

        // 调试
        logger.error(`页面 ${option.path} 加载失败`, errMsg);
      });
  } else {
    logger.error("无页面路径");
  }
};

export interface UrlOptions {
  url: string;
}

export interface PathOptions {
  path: string;
}

export interface MiniprogramOptions {
  appId: string;
  path?: string;
  extraData?: Record<string, unknown>;
  versionType?: "develop" | "trial" | "release";
}

export interface ShortLinkOptions {
  shortLink: string;
  extraData?: Record<string, unknown>;
  versionType?: "develop" | "trial" | "release";
}

export const navigate = (
  options:
    | UrlOptions
    | PathOptions
    | MiniprogramOptions
    | ShortLinkOptions
    | Record<never, never>,
  referer?: string,
): void => {
  if ("appId" in options) {
    const { appId, path, extraData, versionType } = options;

    if (env === "wx") {
      wx.navigateToMiniProgram({
        appId,
        path,
        extraData,
        envVersion: versionType,
      });
    } else if (env === "app") {
      wx.miniapp.launchMiniProgram({
        userName: appId,
        path,
        miniprogramType:
          versionType === "develop" ? 1 : versionType === "trial" ? 2 : 0,
      });
    } else {
      showModal("无法打开", "暂不支持打开微信小程序");
    }
  } else if ("shortLink" in options) {
    const { shortLink, extraData, versionType } = options;

    if (env === "wx") {
      wx.navigateToMiniProgram({
        shortLink,
        extraData,
        envVersion: versionType,
      });
    } else {
      showModal("无法打开", "暂不支持打开微信小程序");
    }
  } else if ("url" in options) {
    const { url } = options;

    // 页面路径
    if (!/^https?:\/\//.test(url))
      go(`${url}${url.includes("?") ? `&` : `?`}from=${referer}`);
    // 为链接
    else {
      // 打开浏览器或 App
      if (env === "app") wx.miniapp.openUrl({ url });
      // 判断是否是可以跳转的微信图文
      else if (
        env === "wx" &&
        url.startsWith("https://mp.weixin.qq.com") &&
        "openOfficialAccountArticle" in wx
      ) {
        wx.openOfficialAccountArticle({ url });
      }
      // 无法跳转，复制链接到剪切板
      else
        writeClipboard(url).then(() => {
          showModal(
            "无法直接打开",
            "小程序无法直接打开网页，链接已复制至剪切板，请打开浏览器粘贴查看。",
          );
        });
    }
  } else if ("path" in options) {
    go(`info?id=${options.path}&from=${referer || "返回"}`);
  }
};

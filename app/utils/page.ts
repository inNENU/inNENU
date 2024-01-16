/* eslint-disable max-lines */
import type { PageInstance, PageQuery } from "@mptool/all";
import { logger, readJSON, writeJSON } from "@mptool/all";

import { id2path } from "./id.js";
import { ensureResource } from "./json.js";
import type { Notice } from "./notice.js";
import { getScopeData } from "./scopeData.js";
import type {
  ComponentConfig,
  FunctionalListComponentItemConfig,
  GridComponentItemConfig,
  ListComponentItemConfig,
  PageData,
  PageDataWithContent,
  PageOption,
} from "../../typings/index.js";
import { requestJSON, showModal } from "../api/index.js";
import type { AppOption } from "../app.js";
import { imageWaterMark } from "../config/index.js";
import { info } from "../state/info.js";

type PageInstanceWithPage = PageInstance<
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any> & { page?: PageData },
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  Record<string, any>
>;

/** 全局数据 */
const { globalData } = getApp<AppOption>();

/**
 * 处理详情内容
 *
 * @param element 列表的内容
 * @param page 页面内容
 */
const resolveContent = (
  listElement: (
    | FunctionalListComponentItemConfig
    | GridComponentItemConfig
    | ListComponentItemConfig
  ) & { hidden?: boolean },
  title = "返回",
):
  | ((
      | FunctionalListComponentItemConfig
      | GridComponentItemConfig
      | ListComponentItemConfig
    ) & { hidden?: boolean })
  | null => {
  if (
    "env" in listElement &&
    listElement.env &&
    !listElement.env?.includes(info.env)
  )
    return null;

  // 设置列表导航
  if ("url" in listElement && !listElement.url!.startsWith("plugin://"))
    listElement.url += `?from=${title}`;
  if ("path" in listElement)
    listElement.url = `info?from=${title}&id=${listElement.path!}`;

  if ("type" in listElement)
    if (listElement.type === "switch")
      // 设置列表开关与滑块
      listElement.status =
        wx.getStorageSync<boolean | undefined>(listElement.key) || false;
    else if (listElement.type === "slider")
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
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
          // eslint-disable-next-line
          (listElement.value as any[])[index] = (
            listElement.select[
              index
              // eslint-disable-next-line
            ] as any[]
          )[Number(pickerElement)];
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (listElement.currentValue as any[])[index] = Number(pickerElement);
        });
      }

  return listElement;
};

export const handleComponents = (
  components: ComponentConfig[],
  images: string[] = [],
  title = "返回",
): ComponentConfig[] =>
  components.map((component) => {
    const { tag } = component;

    // 设置隐藏
    if ("env" in component)
      component.hidden = !component.env?.includes(info.env);

    if (tag === "img") {
      const { src, res, watermark } = component;

      images.push(`${res || src}${watermark ? imageWaterMark : ""}`);
    }

    if (
      "path" in component &&
      (tag === "p" || tag === "ol" || tag === "ul" || tag === "text")
    )
      component.url = `info?from=${title || "返回"}&id=${component.path!}`;

    // 设置 list 组件
    if (
      "items" in component &&
      (tag === "list" || tag === "grid" || tag === "functional-list")
    )
      component.items = component.items
        .map(
          (
            listElement: (
              | FunctionalListComponentItemConfig
              | GridComponentItemConfig
              | ListComponentItemConfig
            ) & { hidden?: boolean },
          ) => resolveContent(listElement, title),
        )
        .filter((listElement) => listElement !== null) as
        | FunctionalListComponentItemConfig[]
        | GridComponentItemConfig[]
        | ListComponentItemConfig[];

    return component;
  });

/**
 * 获得界面数据，生成正确的界面数据
 *
 * @param page 页面数据
 * @param option 页面传参
 *
 * @returns 处理之后的page
 */
const disposePage = (page: PageData, option: PageOption): PageData => {
  // 设置界面名称
  page.id = option.id || page.title;
  // 设置页面来源
  page.from = option.from || "返回";

  if (page.content) {
    handleComponents(page.content, (page.images ??= []), page.title);
    page.scopeData = getScopeData(page as PageDataWithContent);
  }

  // 调试

  logger.info(`Resolve ${page.id!} page success`);

  // 返回处理后的 page
  return page;
};

/**
 * 提前获得子界面。在界面加载完毕时，检查界面包含的所有链接是否已存在本地 json，如果没有立即获取并处理后写入存储
 *
 * @param page 页面数据
 */
const preloadPage = (page: PageData): void => {
  if (page && page.content)
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
              | GridComponentItemConfig
              | ListComponentItemConfig
            ) & { hidden?: boolean },
          ) => {
            if ("path" in element) ensureResource(`${element.path!}`);
          },
        );
    });
  else logger.warn(`Page is empty`);
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
  page?: PageData,
  setGlobal = true,
): PageData | null => {
  // 控制台输出参数
  logger.info("Navigating to: ", options);

  let pageData = null;

  if (page) {
    pageData = disposePage(page, options);
  } else if (options.id) {
    const pageContent = readJSON<PageData>(`${options.id}`);

    if (pageContent) pageData = disposePage(pageContent, options);
    else logger.warn(`Can't resolve ${options.id} because file doesn't exist`);
  }

  if (pageData && setGlobal) {
    // 写入 globalData
    globalData.page.id = options.id || pageData.title;
    globalData.page.data = pageData;
  }

  return pageData;
};

export interface ColorConfig {
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
export const getColor = (grey = false): ColorConfig => {
  let temp: [string, string, string];

  if (info.darkmode && grey)
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
  else if (info.darkmode && !grey)
    switch (info.theme) {
      case "ios":
      case "Android":
      case "nenu":
      default:
        temp = ["#000000", "#000000", "#000000"];
    }
  else if (!info.darkmode && grey)
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

interface SetPageOption {
  option: PageOption;
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
  { option, ctx, handle = false }: SetPageOption,
  page?: PageData,
  preload = true,
): Promise<void> =>
  new Promise((resolve) => {
    // 设置页面数据
    if (page) {
      const pageData = handle ? page : disposePage(page, option);

      ctx.setData(
        {
          color: getColor(pageData.grey),
          theme: info.theme,
          darkmode: info.darkmode,
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
      (ctx.data.page &&
        ctx.data.page.title &&
        globalData.page.id === ctx.data.page.title)
    ) {
      const { id } = globalData.page;

      logger.debug(`${id} has been resolved`);
      ctx.setData(
        {
          color: getColor(globalData.page.data?.grey),
          theme: info.theme,
          darkmode: info.darkmode,
          page: globalData.page.data,
        },
        () => {
          logger.debug(`${id} pageData is set`);
          if (preload) {
            preloadPage(ctx.data.page!);
            logger.debug(`Preloaded ${id} links`);
          }
          resolve();
        },
      );
    } else if (ctx.data.page) {
      logger.debug(`${option.id || "Unknown"} not resolved`);

      const pageData: PageData = handle
        ? ctx.data.page
        : disposePage(ctx.data.page, option);

      // 设置页面数据
      ctx.setData(
        {
          color: getColor(pageData.grey),
          theme: info.theme,
          darkmode: info.darkmode,
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
export const popNotice = (id: string): void => {
  if (!wx.getStorageSync(`${id}-notifyed`)) {
    // 没有进行过通知，判断是否需要弹窗，从存储中获取通知内容并展示
    const notice = wx.getStorageSync<Notice | undefined>(`${id}-notice`);

    if (notice) {
      showModal(notice.title, notice.content, () => {
        // 防止二次弹窗
        wx.setStorageSync(`${id}-notifyed`, true);
      });

      // 调试
      logger.info(`Pop notice in ${id} page`);
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
// eslint-disable-next-line max-lines-per-function
export const setOnlinePage = (
  option: PageOption,
  ctx: PageInstanceWithPage,
  preload = true,
): void => {
  const { id } = option;

  if (id)
    if (globalData.page.id === id) {
      // 页面已经预处理完毕，立即写入 page 并执行本界面的预加载
      logger.debug(`${id} has been resolved`);

      ctx.setData(
        {
          color: getColor(globalData.page.data!.grey),
          theme: info.theme,
          darkmode: info.darkmode,
          page: globalData.page.data,
        },
        () => {
          logger.debug(`${id} pageData is set`);
          popNotice(id);

          if (preload) {
            preloadPage(ctx.data.page!);
            logger.debug(`Preloaded ${id} links`);
          }
        },
      );
    } else {
      // 需要重新载入界面
      logger.info(`${id} onLoad with options: `, option);

      const page = readJSON<PageData>(`${id}`);

      // 如果本地存储中含有 page 直接处理
      if (page) {
        setPage({ option, ctx }, page);
        popNotice(id);
        logger.info(`${id} onLoad success: `, ctx.data);

        // 如果需要执行预加载，则执行
        if (preload) {
          preloadPage(ctx.data.page!);
          logger.debug(`${id} preload complete`);
        }
      }
      // 请求页面Json
      else {
        requestJSON<PageData>(`d/${id}`)
          .then((data) => {
            // 非分享界面下将页面数据写入存储
            if (option.from !== "share") writeJSON(`${id}`, data);

            // 设置界面
            setPage({ option, ctx }, data);

            // 如果需要执行预加载，则执行
            if (preload) {
              preloadPage(ctx.data.page!);
              logger.debug(`Preload ${id} complete`);
            }

            // 弹出通知
            popNotice(id);

            // 调试
            logger.info(`${id} onLoad Succeed`);
          })
          .catch((err) => {
            // 设置 error 页面并弹出通知
            setPage(
              { option, ctx },
              {
                error: true,
                id: option.id,
                from: option.from,
                statusBarHeight: info.statusBarHeight,
              },
            );
            popNotice(option.id || "");

            // 调试
            logger.warn(`${id} onLoad failed with error:`, err);
          });
      }
    }
  else logger.error("no id");
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
  option: PageOption & { path: string },
  ctx: PageInstanceWithPage,
): void => {
  if (option.path) {
    option.id = id2path(option.path);

    logger.info(`${option.path} onLoad starts with options:`, option);

    // 需要在线获取界面
    requestJSON<PageData>(`d/${option.id}`)
      .then((page) => {
        if (page) {
          setPage({ option, ctx }, page);
          popNotice(option.path);
          logger.info(`${option.path} onLoad succeed:`, ctx.data);
        }
      })
      .catch((errMsg) => {
        // 设置 error 页面并弹出通知
        setPage(
          { option, ctx },
          {
            error: true,
            id: option.id,
            from: option.from,
            statusBarHeight: info.statusBarHeight,
          },
        );
        popNotice(option.id || "");

        // 调试
        logger.warn(`${option.path} onLoad failed with error: `, errMsg);
      });
  } else {
    logger.error("no path");
  }
};

import type {
  PageStateWithContent,
  TextComponentData,
  TitleComponentData,
} from "../../typings/index.js";
import { appCoverPrefix, appName } from "../config/index.js";

const getText = (page: PageStateWithContent): string => {
  const pageContent = page.content
    .filter(
      (element): element is TextComponentData =>
        element.tag === "text" ||
        element.tag === "p" ||
        element.tag === "ul" ||
        element.tag === "ol",
    )
    .map(
      (element) =>
        `${typeof element.header === "string" ? `${element.header} ` : ""}${
          element.text ? element.text.join(" ") : ""
        }`,
    )
    .join("");

  return pageContent.length > 120 ? pageContent.slice(0, 120) : pageContent;
};

const getTags = (page: PageStateWithContent): string[] => {
  const titles = page.content
    .filter((element): element is TitleComponentData => element.tag === "title")
    .map((element) => element.text);

  return titles.length
    ? titles.length <= 10
      ? titles
      : titles.slice(0, 10)
    : page.title
      ? [page.title]
      : [];
};

const getImages = (page: PageStateWithContent): string[] =>
  page.images
    ? page.images.length > 10
      ? page.images.slice(0, 10)
      : page.images.length === 0
        ? [`${appCoverPrefix}jpg`]
        : page.images
    : [`${appCoverPrefix}jpg`];

export const getScopeData = (
  page: PageStateWithContent,
): WechatMiniprogram.GeneralScopeData => ({
  // eslint-disable-next-line @typescript-eslint/naming-convention
  "@type": "general",
  // eslint-disable-next-line @typescript-eslint/naming-convention
  uniq_id: page.id!,
  title: page.title || appName,
  ...(page.images ? { cover: page.images[0] } : {}),
  digest: getText(page),
  thumbs: getImages(page),
  tags: getTags(page),
});

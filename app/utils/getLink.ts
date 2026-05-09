import { readFile } from "@mptool/all";

import { assets } from "../config/index.js";

export const HTTP_PREFIX = /^https?:\/\//u;

export const isHttpLink = (link: string): boolean => HTTP_PREFIX.test(link);

export const getAssetLink = (path = ""): string =>
  path.startsWith("$") ? `${assets}${path.slice(1)}` : path;

export const getIconLink = (icon = ""): string =>
  icon
    ? !icon.includes(".") && !isHttpLink(icon)
      ? readFile(`icon/${icon}`) || ""
      : getAssetLink(icon)
    : "";

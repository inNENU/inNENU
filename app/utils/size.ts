import { windowInfo } from "../state/index.js";

export const getSizeClass = (
  windowWidth?: number,
): "small" | "medium" | "large" | "large xl" => {
  const width = windowWidth ?? windowInfo.windowWidth;

  return width < 556
    ? "small"
    : width < 768
      ? "medium"
      : width < 1024
        ? "large"
        : "large xl";
};

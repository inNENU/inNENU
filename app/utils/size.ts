import { windowInfo } from "../state/index.js";

export const getSizeClass = (
  windowWidth?: number,
): "small" | "medium" | "large" | "large xl" => {
  const width = windowWidth ?? windowInfo.windowWidth;

  return width < 480
    ? "small"
    : width < 1024
      ? "medium"
      : width < 768
        ? "large"
        : "large xl";
};

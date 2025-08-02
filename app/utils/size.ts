export const getSizeClass = (
  windowWidth: number,
): "small" | "medium" | "large" | "large xl" =>
  windowWidth < 480
    ? "small"
    : windowWidth < 1024
      ? "medium"
      : windowWidth < 768
        ? "large"
        : "large xl";

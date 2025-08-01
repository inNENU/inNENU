export const getSizeClass = (
  windowWidth: number,
): "small" | "medium" | "large" | "xlarge" =>
  windowWidth < 480
    ? "small"
    : windowWidth < 1024
      ? "medium"
      : windowWidth < 768
        ? "large"
        : "xlarge";

export const id2path = (id = ""): string =>
  id
    .replace(/^A/, "apartment/")
    .replace(/^S/, "school/")
    .replace(/^G/, "guide/")
    .replace(/^I/, "intro/")
    .replace(/^N/, "newcomer/")
    .replace(/^O/, "other/")
    .replace(/\/$/, "/index");

export const path2id = (path = ""): string =>
  path
    .replace(/^apartment\//, "A")
    .replace(/^school\//, "S")
    .replace(/^guide\//, "G")
    .replace(/^intro\//, "I")
    .replace(/^newcomer\//, "N")
    .replace(/^other\//, "O")
    .replace(/\/index$/, "/");

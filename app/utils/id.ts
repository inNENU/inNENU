export const id2path = (id = ""): string =>
  id
    .replace(/^A/u, "apartment/")
    .replace(/^S/u, "school/")
    .replace(/^G/u, "guide/")
    .replace(/^I/u, "intro/")
    .replace(/^N/u, "newcomer/")
    .replace(/^O/u, "other/")
    .replace(/\/$/u, "/index");

export const path2id = (path = ""): string =>
  path
    .replace(/^apartment\//u, "A")
    .replace(/^school\//u, "S")
    .replace(/^guide\//u, "G")
    .replace(/^intro\//u, "I")
    .replace(/^newcomer\//u, "N")
    .replace(/^other\//u, "O")
    .replace(/\/index$/u, "/");

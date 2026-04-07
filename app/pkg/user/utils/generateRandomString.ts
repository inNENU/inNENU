// oxlint-disable-next-line unicorn/prefer-spread
const DEFAULT_DICTIONARY = "0123456789".split("");

export const generateRandomString = (length: number, dic = DEFAULT_DICTIONARY): string => {
  const result = [];

  for (let i = 0; i < length; i++) result.push(dic[Math.floor(Math.random() * dic.length)]);

  return result.join("");
};

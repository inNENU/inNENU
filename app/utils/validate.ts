const ID_REG = new RegExp(/^(\d{6})(\d{4})(\d{2})(\d{2})(\d{3})([0-9]|X)$/);
const ID_GENERATE = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
const ID_VALIDATE = ["1", "0", "X", "9", "8", "7", "6", "5", "4", "3", "2"];

export const validateId = (id: string): boolean => {
  const result = ID_REG.exec(id);

  if (!result) return false;

  let nTemp = 0;

  for (let i = 0; i < 17; i++) {
    nTemp += Number(id[i]) * ID_GENERATE[i];
  }

  return ID_VALIDATE[nTemp % 11] === id[17];
};

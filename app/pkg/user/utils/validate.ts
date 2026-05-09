export const isCellPhone = (phone: string): boolean => /^1[3-9]\d{9}$/u.test(phone);

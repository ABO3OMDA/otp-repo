export const generateOtp = (length = 6): string => {
  return Array(length)
    .fill(0)
    .map(() => Math.floor(Math.random() * 10))
    .join('');
};

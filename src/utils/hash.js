import sha256 from "crypto-js/sha256";

export const hashPassword = (password) => {
  if (!password) return null;
  return sha256(password).toString();
};

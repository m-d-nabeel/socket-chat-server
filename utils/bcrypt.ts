import bcrypt from "bcrypt";

export const hashRefreshToken = async (refreshToken: string) => {
  return new Promise((resolve, reject) => {
    bcrypt.hash(refreshToken, 10, (err, hashedToken) => {
      if (err) {
        reject(err);
      } else {
        resolve(hashedToken);
      }
    });
  });
};

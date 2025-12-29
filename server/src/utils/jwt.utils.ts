import jwt from "jsonwebtoken";

export const generateAccessToken = (
  userId: string,
  role: string,
  modulePermissions: { users: boolean; forms: boolean } | undefined
) => {
  return jwt.sign(
    { userId, role, modulePermissions },
    process.env.JWT_SECRET!,
    { expiresIn: "15m" }
  );
};

export const generateRefreshToken = (userId: string) => {
  return jwt.sign({ userId }, process.env.JWT_REFRESH_SECRET!, {
    expiresIn: "7d",
  });
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_SECRET!, { algorithms: ["HS256"] });
};

export const verifyRefreshToken = (token: string) => {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!, {
    algorithms: ["HS256"],
  });
};

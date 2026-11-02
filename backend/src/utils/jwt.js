import jwt from "jsonwebtoken";
import { env } from "../config/env.js";

export const signToken = (user) =>
  jwt.sign({ sub: String(user.id), role: user.role, name: user.name }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN,
  });

export const verifyToken = (token) => {
  const payload = jwt.verify(token, env.JWT_SECRET);
  return { id: Number(payload.sub), role: payload.role, name: payload.name };
};

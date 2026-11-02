import { AppError } from "../utils/AppError.js";
import { verifyToken } from "../utils/jwt.js";

const readBearer = (req) => {
  const [scheme, token] = (req.headers.authorization ?? "").split(" ");
  return scheme === "Bearer" && token ? token : null;
};

export function authenticate(req, _res, next) {
  const token = readBearer(req);
  if (!token) return next(AppError.unauthorized());
  try {
    req.user = verifyToken(token);
    next();
  } catch {
    next(AppError.unauthorized("Invalid or expired token"));
  }
}

// Attaches req.user when a valid token is present, otherwise continues anonymously
export function optionalAuth(req, _res, next) {
  const token = readBearer(req);
  if (token) {
    try {
      req.user = verifyToken(token);
    } catch {
      req.user = undefined;
    }
  }
  next();
}

export const authorize =
  (...roles) =>
  (req, _res, next) => {
    if (!req.user) return next(AppError.unauthorized());
    if (!roles.includes(req.user.role)) return next(AppError.forbidden());
    next();
  };

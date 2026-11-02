// Parses params/query/body with Zod and exposes the result on req.validated
export const validate = (schemas) => (req, _res, next) => {
  req.validated = {};
  for (const part of ["params", "query", "body"]) {
    if (schemas[part]) req.validated[part] = schemas[part].parse(req[part] ?? {});
  }
  next();
};

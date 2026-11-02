import cors from "cors";
import express from "express";
import helmet from "helmet";
import morgan from "morgan";
import { env } from "./config/env.js";
import { errorHandler, notFound } from "./middleware/errorHandler.js";
import routes from "./routes/index.js";

const app = express();

app.set("trust proxy", 1);
app.use(helmet());
app.use(cors({ origin: env.CORS_ORIGIN.split(",").map((origin) => origin.trim()) }));
app.use(express.json({ limit: "100kb" }));
if (env.NODE_ENV !== "test") app.use(morgan(env.NODE_ENV === "production" ? "combined" : "dev"));

app.get("/", (_req, res) => res.json({ name: "FoodHub API", health: "/api/health" }));
app.use("/api", routes);

app.use(notFound);
app.use(errorHandler);

export default app;

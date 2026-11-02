import axios from "axios";
import { env } from "../config/env.js";
import { AppError } from "../utils/AppError.js";
import { cacheKey, getOrSet } from "../utils/cache.js";

const AI_CACHE_TTL = 600;

const client = axios.create({ baseURL: env.AI_SERVICE_URL, timeout: env.AI_TIMEOUT_MS });

const toAppError = (error) => {
  const status = error.response?.status;
  const detail = typeof error.response?.data?.detail === "string" ? error.response.data.detail : undefined;
  if (status >= 400 && status < 500) return new AppError(status, detail ?? "AI request rejected", "AI_REQUEST_ERROR");
  return AppError.serviceUnavailable(detail ?? "AI recommendation service is unavailable");
};

const call = async (request) => {
  try {
    const { data } = await request();
    return data;
  } catch (error) {
    throw toAppError(error);
  }
};

export const aiService = {
  recommend(body, user) {
    const payload = { ...body, user_id: user?.id ?? null };
    const key = cacheKey("ai:rec", { ...payload, query: body.query.toLowerCase() });
    return getOrSet(key, () => call(() => client.post("/recommend", payload)), AI_CACHE_TTL);
  },

  forYou(user, limit = 6) {
    return getOrSet(
      `ai:for-you:${user.id}:${limit}`,
      () => call(() => client.get(`/recommend/for-you/${user.id}`, { params: { limit } })),
      AI_CACHE_TTL
    );
  },

  // Fire-and-forget: menu writes shouldn't fail because the AI service is down
  requestReindex() {
    client
      .post("/index/rebuild", null, { headers: { "X-Internal-Key": env.INTERNAL_API_KEY } })
      .catch((error) => {
        if (env.NODE_ENV !== "test") console.warn("AI reindex request failed:", error.message);
      });
  },
};

import { aiService } from "../services/aiService.js";

export const aiController = {
  async recommend(req, res) {
    res.json({ data: await aiService.recommend(req.validated.body, req.user) });
  },

  async forYou(req, res) {
    res.json({ data: await aiService.forYou(req.user) });
  },
};

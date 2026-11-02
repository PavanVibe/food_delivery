import { analyticsService } from "../services/analyticsService.js";

export const analyticsController = {
  async summary(req, res) {
    res.json({ data: await analyticsService.summary(req.user, req.validated.query) });
  },

  async sales(req, res) {
    res.json({ data: await analyticsService.sales(req.user, req.validated.query) });
  },

  async topFoods(req, res) {
    res.json({ data: await analyticsService.topFoods(req.user, req.validated.query) });
  },

  async peakHours(req, res) {
    res.json({ data: await analyticsService.peakHours(req.user, req.validated.query) });
  },
};

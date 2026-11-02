import { restaurantService } from "../services/restaurantService.js";

export const restaurantController = {
  async list(req, res) {
    res.json({ data: await restaurantService.list(req.validated.query) });
  },

  async getById(req, res) {
    res.json({ data: await restaurantService.getById(req.validated.params.id) });
  },

  async mine(req, res) {
    res.json({ data: await restaurantService.mine(req.user) });
  },
};

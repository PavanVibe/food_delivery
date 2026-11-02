import { cartService } from "../services/cartService.js";

export const cartController = {
  async get(req, res) {
    res.json({ data: await cartService.get(req.user.id) });
  },

  async addItem(req, res) {
    res.status(201).json({ data: await cartService.addItem(req.user.id, req.validated.body) });
  },

  async updateItem(req, res) {
    const { foodId } = req.validated.params;
    res.json({ data: await cartService.updateItem(req.user.id, foodId, req.validated.body.quantity) });
  },

  async removeItem(req, res) {
    res.json({ data: await cartService.removeItem(req.user.id, req.validated.params.foodId) });
  },

  async clear(req, res) {
    res.json({ data: await cartService.clear(req.user.id) });
  },
};

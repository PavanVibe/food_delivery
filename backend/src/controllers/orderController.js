import { orderService } from "../services/orderService.js";

export const orderController = {
  async checkout(req, res) {
    res.status(201).json({ data: await orderService.checkout(req.user.id, req.validated.body) });
  },

  async listMine(req, res) {
    res.json(await orderService.listMine(req.user.id, req.validated.query));
  },

  async getById(req, res) {
    res.json({ data: await orderService.getById(req.user, req.validated.params.id) });
  },

  async cancel(req, res) {
    res.json({ data: await orderService.cancel(req.user, req.validated.params.id) });
  },

  async listForManagement(req, res) {
    res.json(await orderService.listForManagement(req.user, req.validated.query));
  },

  async updateStatus(req, res) {
    const { id } = req.validated.params;
    res.json({ data: await orderService.updateStatus(req.user, id, req.validated.body.status) });
  },
};

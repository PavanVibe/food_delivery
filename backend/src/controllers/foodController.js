import { foodService } from "../services/foodService.js";

export const foodController = {
  async list(req, res) {
    res.json(await foodService.list(req.validated.query));
  },

  async search(req, res) {
    res.json({ data: await foodService.search(req.validated.query) });
  },

  async getById(req, res) {
    res.json({ data: await foodService.getById(req.validated.params.id) });
  },

  async categories(_req, res) {
    res.json({ data: await foodService.categories() });
  },

  async create(req, res) {
    res.status(201).json({ data: await foodService.create(req.user, req.validated.body) });
  },

  async update(req, res) {
    res.json({ data: await foodService.update(req.user, req.validated.params.id, req.validated.body) });
  },

  async remove(req, res) {
    await foodService.remove(req.user, req.validated.params.id);
    res.status(204).end();
  },
};

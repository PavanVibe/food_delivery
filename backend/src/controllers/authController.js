import { authService } from "../services/authService.js";

export const authController = {
  async register(req, res) {
    const result = await authService.register(req.validated.body);
    res.status(201).json({ data: result });
  },

  async login(req, res) {
    const result = await authService.login(req.validated.body);
    res.json({ data: result });
  },

  async me(req, res) {
    res.json({ data: await authService.me(req.user.id) });
  },
};

import bcrypt from "bcrypt";
import { userRepository } from "../repositories/userRepository.js";
import { AppError } from "../utils/AppError.js";
import { signToken } from "../utils/jwt.js";

const SALT_ROUNDS = 10;

export const authService = {
  async register({ name, email, password }) {
    if (await userRepository.findByEmail(email)) {
      throw AppError.conflict("An account with this email already exists");
    }
    const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await userRepository.create({ name, email, passwordHash });
    return { user, token: signToken(user) };
  },

  async login({ email, password }) {
    const record = await userRepository.findByEmail(email);
    const valid = record ? await bcrypt.compare(password, record.password_hash) : false;
    if (!valid) throw AppError.unauthorized("Invalid email or password");

    const { password_hash: _hash, ...user } = record;
    return { user, token: signToken(user) };
  },

  async me(userId) {
    const user = await userRepository.findById(userId);
    if (!user) throw AppError.notFound("User");
    return user;
  },
};

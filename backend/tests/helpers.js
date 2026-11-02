import { signToken } from "../src/utils/jwt.js";

export const customer = { id: 1, name: "Asha", role: "customer" };
export const owner = { id: 2, name: "Riya", role: "restaurant_owner" };
export const admin = { id: 3, name: "Admin", role: "admin" };

export const bearer = (user) => `Bearer ${signToken(user)}`;

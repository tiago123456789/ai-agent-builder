import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { config } from "../config";
import { usersRepository } from "../repository/users";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  rule: "admin" | "employee";
  groupToolsAllowedId?: string | null;
};

export async function validateCredentials(
  email: string,
  password: string,
): Promise<AuthUser | null> {
  const user = await usersRepository.getUserByEmail(email);
  if (!user) return null;
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    rule: user.rule,
    groupToolsAllowedId: user.group_tools_allowed_id ?? null,
  };
}

export function signToken(user: AuthUser) {
  return jwt.sign(user, config.jwtSecret, { expiresIn: "12h" });
}

export function verifyToken(token: string) {
  return jwt.verify(token, config.jwtSecret) as AuthUser;
}

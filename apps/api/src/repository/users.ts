import bcrypt from "bcryptjs";
import { db } from "../db/knex";

export type UserRow = {
  id: string;
  name: string;
  email: string;
  password: string;
  rule: "admin" | "employee";
  group_tools_allowed_id: string | null;
  control_group_rag_id: string | null;
  created_at: string;
  updated_at: string;
};

export type UserPublic = {
  id: string;
  name: string;
  email: string;
  rule: "admin" | "employee";
  groupToolsAllowedId: string | null;
  controlGroupRagId: string | null;
  createdAt: string;
};

export class UsersRepository {
  private toPublic(row: UserRow): UserPublic {
    return {
      id: row.id,
      name: row.name,
      email: row.email,
      rule: row.rule,
      groupToolsAllowedId: row.group_tools_allowed_id ?? null,
      controlGroupRagId: row.control_group_rag_id ?? null,
      createdAt: row.created_at,
    };
  }

  async listUsers(): Promise<UserPublic[]> {
    const rows = await db("users")
      .select("id", "name", "email", "rule", "group_tools_allowed_id", "control_group_rag_id", "created_at")
      .orderBy("created_at", "desc");
    return rows.map((row: any) => this.toPublic(row));
  }

  async getUserByEmail(email: string): Promise<UserRow | null> {
    const row = await db<UserRow>("users").where({ email }).first();
    return row ?? null;
  }

  async getUserById(id: string): Promise<UserRow | null> {
    const row = await db<UserRow>("users").where({ id }).first();
    return row ?? null;
  }

  async createUser(data: {
    name: string;
    email: string;
    password: string;
    rule: "admin" | "employee";
    groupToolsAllowedId?: string | null;
    controlGroupRagId?: string | null;
  }): Promise<UserPublic> {
    const hashed = await bcrypt.hash(data.password, 10);
    const [row] = await db("users")
      .insert({
        name: data.name,
        email: data.email,
        password: hashed,
        rule: data.rule,
        group_tools_allowed_id: data.groupToolsAllowedId ?? null,
        control_group_rag_id: data.controlGroupRagId ?? null,
      })
      .returning(["id", "name", "email", "rule", "group_tools_allowed_id", "control_group_rag_id", "created_at"]);
    return this.toPublic(row);
  }

  async updateUser(
    id: string,
    data: { name?: string; email?: string; password?: string; rule?: "admin" | "employee"; groupToolsAllowedId?: string | null; controlGroupRagId?: string | null },
  ): Promise<UserPublic | null> {
    const update: Record<string, any> = {};
    if (data.name !== undefined) update.name = data.name;
    if (data.email !== undefined) update.email = data.email;
    if (data.password !== undefined) {
      update.password = await bcrypt.hash(data.password, 10);
    }
    if (data.rule !== undefined) update.rule = data.rule;
    if (data.groupToolsAllowedId !== undefined) update.group_tools_allowed_id = data.groupToolsAllowedId;
    if (data.controlGroupRagId !== undefined) update.control_group_rag_id = data.controlGroupRagId;
    update.updated_at = db.fn.now();

    const [row] = await db("users")
      .where({ id })
      .update(update)
      .returning(["id", "name", "email", "rule", "group_tools_allowed_id", "control_group_rag_id", "created_at"]);
    return row ? this.toPublic(row) : null;
  }

  async deleteUser(id: string): Promise<boolean> {
    const deleted = await db("users").where({ id }).del();
    return deleted > 0;
  }
}

export const usersRepository = new UsersRepository();

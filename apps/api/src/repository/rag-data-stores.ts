import { db } from "../db/knex";
import type { RagDataStore } from "../types";

export class RagDataStoresRepository {
  private rowToRagDataStore(row: any): RagDataStore {
    return {
      id: row.id,
      description: row.description,
      connection: row.connection,
      createdAt: row.created_at,
    };
  }

  async getById(id: string): Promise<RagDataStore[]> {
    const rows = await db("rag_data_stores").select("*").where("id", id).orderBy("created_at", "desc");
    return rows.map(this.rowToRagDataStore);
  }

  async listRagDataStores(): Promise<RagDataStore[]> {
    const rows = await db("rag_data_stores").select("*").orderBy("created_at", "desc");
    return rows.map(this.rowToRagDataStore);
  }

  async createRagDataStore(data: {
    description: string;
    connection: string;
  }): Promise<RagDataStore> {
    const [row] = await db("rag_data_stores").insert(data).returning("*");
    return this.rowToRagDataStore(row);
  }
}

export const ragDataStoresRepository = new RagDataStoresRepository();

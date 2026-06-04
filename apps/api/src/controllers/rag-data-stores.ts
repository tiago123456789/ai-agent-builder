import type { NextFunction, Request, Response } from "express";
import { OpenAIEmbeddings } from "@langchain/openai";
import { PGVectorStore } from "@langchain/community/vectorstores/pgvector";
import { ragDataStoresRepository } from "../repository/rag-data-stores";
import Encrypter from "../lib/encrypter";
import {
  createRagDataStoreSchema,
  addDocumentSchema,
  updateDocumentSchema,
} from "../validations/rag-data-stores";

export class RagDataStoresController {
  async list(_req: Request, res: Response, next: NextFunction) {
    try {
      const stores = await ragDataStoresRepository.listRagDataStores();
      res.json({ ragDataStores: stores });
    } catch (error) {
      next(error);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    const parsed = createRagDataStoreSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    try {
      parsed.data.connection = new Encrypter().encrypt(parsed.data.connection)
      const store = await ragDataStoresRepository.createRagDataStore({
        description: parsed.data.description,
        connection: parsed.data.connection,
      });
      res.status(201).json({ ragDataStore: store });
    } catch (error) {
      next(error);
    }
  }

  async addDocument(req: Request, res: Response, next: NextFunction) {
    const parsed = addDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    const { id } = req.params as { id: string };
    const { text } = parsed.data;

    try {
      const stores = await ragDataStoresRepository.getById(id);
      const store = stores[0];
      if (!store) {
        return res.status(404).json({ message: "Rag data store not found" });
      }

      const connectionString = new Encrypter().decrypt(store.connection);
      const postgresConnectionOptions = {
        type: "postgres" as const,
        connectionString,
      };

      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
      });

      const vectorStore = await PGVectorStore.initialize(
        embeddings,
        {
          postgresConnectionOptions,
          tableName: "documents",
          columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
          },
        }
      );

      await vectorStore.addDocuments([
        {
          pageContent: text,
          metadata: { dataStoreId: id },
        },
      ]);

      res.status(201).json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async search(req: Request, res: Response, next: NextFunction) {
    const { id } = req.params as { id: string };
    const query = (req.query.q as string) || "";

    if (!query.trim()) {
      return res.status(400).json({ message: "Search query is required" });
    }

    try {
      const stores = await ragDataStoresRepository.getById(id);
      const store = stores[0];
      if (!store) {
        return res.status(404).json({ message: "Rag data store not found" });
      }

      const connectionString = new Encrypter().decrypt(store.connection);
      const postgresConnectionOptions = {
        type: "postgres" as const,
        connectionString,
      };

      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
      });

      const vectorStore = await PGVectorStore.initialize(
        embeddings,
        {
          postgresConnectionOptions,
          tableName: "documents",
          columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
          },
        }
      );

      const queryEmbedding = await embeddings.embedQuery(query);
      const results = await vectorStore.similaritySearchVectorWithScores(queryEmbedding, 20);

      const mapped = results
        .map(([doc, scores]) => ({
          id: doc.id as string,
          content: doc.pageContent,
          score: scores.similarity,
        }))
        .sort((a, b) => b.score - a.score);

      res.json({ results: mapped });
    } catch (error) {
      next(error);
    }
  }

  async updateDocument(req: Request, res: Response, next: NextFunction) {
    const parsed = updateDocumentSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        message: "Invalid request body",
        issues: parsed.error.issues,
      });
    }

    const { id, docId } = req.params as { id: string; docId: string };
    const { content } = parsed.data;

    try {
      const stores = await ragDataStoresRepository.getById(id);
      const store = stores[0];
      if (!store) {
        return res.status(404).json({ message: "Rag data store not found" });
      }

      const connectionString = new Encrypter().decrypt(store.connection);
      const postgresConnectionOptions = {
        type: "postgres" as const,
        connectionString,
      };

      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
      });

      const vectorStore = await PGVectorStore.initialize(
        embeddings,
        {
          postgresConnectionOptions,
          tableName: "documents",
          columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
          },
        }
      );

      await vectorStore.delete({ ids: [docId] });

      await vectorStore.addDocuments(
        [{ pageContent: content, metadata: { dataStoreId: id } }],
        { ids: [docId] },
      );

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }

  async deleteDocument(req: Request, res: Response, next: NextFunction) {
    const { id, docId } = req.params as { id: string; docId: string };

    try {
      const stores = await ragDataStoresRepository.getById(id);
      const store = stores[0];
      if (!store) {
        return res.status(404).json({ message: "Rag data store not found" });
      }

      const connectionString = new Encrypter().decrypt(store.connection);
      const postgresConnectionOptions = {
        type: "postgres" as const,
        connectionString,
      };

      const embeddings = new OpenAIEmbeddings({
        model: "text-embedding-3-small",
      });

      const vectorStore = await PGVectorStore.initialize(
        embeddings,
        {
          postgresConnectionOptions,
          tableName: "documents",
          columns: {
            idColumnName: "id",
            vectorColumnName: "embedding",
            contentColumnName: "content",
            metadataColumnName: "metadata",
          },
        }
      );

      await vectorStore.delete({ ids: [docId] });

      res.json({ success: true });
    } catch (error) {
      next(error);
    }
  }
}

export const ragDataStoresController = new RagDataStoresController();

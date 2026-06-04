import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { ragDataStoresController } from "../controllers/rag-data-stores";

export const ragDataStoresRouter = Router();

ragDataStoresRouter.get("/", requireAuth, (req, res, next) => ragDataStoresController.list(req, res, next));
ragDataStoresRouter.post("/", requireAuth, requireAdmin, (req, res, next) => ragDataStoresController.create(req, res, next));
ragDataStoresRouter.post("/:id/documents", requireAuth, requireAdmin, (req, res, next) => ragDataStoresController.addDocument(req, res, next));
ragDataStoresRouter.get("/:id/search", requireAuth, requireAdmin, (req, res, next) => ragDataStoresController.search(req, res, next));
ragDataStoresRouter.put("/:id/documents/:docId", requireAuth, requireAdmin, (req, res, next) => ragDataStoresController.updateDocument(req, res, next));
ragDataStoresRouter.delete("/:id/documents/:docId", requireAuth, requireAdmin, (req, res, next) => ragDataStoresController.deleteDocument(req, res, next));

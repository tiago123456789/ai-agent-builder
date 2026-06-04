import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { toolsController } from "../controllers/tools";

export const toolsRouter = Router();

toolsRouter.get("/", requireAuth, (req, res, next) => toolsController.list(req, res, next));
toolsRouter.post("/", requireAuth, requireAdmin, (req, res, next) => toolsController.create(req, res, next));
toolsRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) => toolsController.remove(req, res, next));

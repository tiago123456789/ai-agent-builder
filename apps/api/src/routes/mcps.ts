import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { mcpsController } from "../controllers/mcps";

export const mcpsRouter = Router();

mcpsRouter.get("/", requireAuth, (req, res, next) => mcpsController.list(req, res, next));
mcpsRouter.post("/", requireAuth, requireAdmin, (req, res, next) => mcpsController.create(req, res, next));
mcpsRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) => mcpsController.remove(req, res, next));

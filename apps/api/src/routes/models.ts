import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { modelsController } from "../controllers/models";

export const modelsRouter = Router();

modelsRouter.get("/", requireAuth, (req, res, next) => modelsController.list(req, res, next));

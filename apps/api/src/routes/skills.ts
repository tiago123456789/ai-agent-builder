import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { skillsController } from "../controllers/skills";

export const skillsRouter = Router();

skillsRouter.get("/", requireAuth, (req, res, next) => skillsController.list(req, res, next));
skillsRouter.get("/:id", requireAuth, (req, res, next) => skillsController.getById(req, res, next));
skillsRouter.post("/", requireAuth, requireAdmin, (req, res, next) => skillsController.create(req, res, next));
skillsRouter.put("/:id", requireAuth, requireAdmin, (req, res, next) => skillsController.update(req, res, next));
skillsRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) => skillsController.remove(req, res, next));

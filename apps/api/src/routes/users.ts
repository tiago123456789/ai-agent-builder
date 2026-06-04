import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { usersController } from "../controllers/users";

export const usersRouter = Router();

usersRouter.get("/", requireAuth, requireAdmin, (req, res, next) => usersController.list(req, res, next));
usersRouter.post("/", requireAuth, requireAdmin, (req, res, next) => usersController.create(req, res, next));
usersRouter.put("/:id", requireAuth, requireAdmin, (req, res, next) => usersController.update(req, res, next));
usersRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) => usersController.remove(req, res, next));

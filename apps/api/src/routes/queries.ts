import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { queriesController } from "../controllers/queries";

export const queriesRouter = Router();

queriesRouter.get("/", requireAuth, (req, res, next) => queriesController.list(req, res, next));

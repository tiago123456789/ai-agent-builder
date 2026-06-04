import { Router } from "express";
import { healthController } from "../controllers/health";

export const healthRouter = Router();

healthRouter.get("/", (req, res, next) => healthController.getHealth(req, res, next));

import { Router } from "express";
import { agentsPublicController } from "../controllers/agents-public";

export const agentsPublicRouter = Router();

agentsPublicRouter.post("/chat", (req, res, next) => agentsPublicController.chat(req, res, next));

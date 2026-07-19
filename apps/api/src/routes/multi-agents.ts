import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { multiAgentsController } from "../controllers/multi-agents";

export const multiAgentsRouter = Router();

multiAgentsRouter.get("/", requireAuth, (req, res, next) => multiAgentsController.list(req, res, next));
multiAgentsRouter.get("/:id", requireAuth, (req, res, next) => multiAgentsController.getById(req, res, next));
multiAgentsRouter.post("/create", requireAuth, requireAdmin, (req, res, next) => multiAgentsController.create(req, res, next));
multiAgentsRouter.put("/:id", requireAuth, requireAdmin, (req, res, next) => multiAgentsController.update(req, res, next));
multiAgentsRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) => multiAgentsController.remove(req, res, next));
multiAgentsRouter.get("/:id/agents", requireAuth, (req, res, next) => multiAgentsController.listAgents(req, res, next));
multiAgentsRouter.post("/:id/agents", requireAuth, requireAdmin, (req, res, next) => multiAgentsController.linkAgents(req, res, next));
multiAgentsRouter.delete("/:id/agents/:agentId", requireAuth, requireAdmin, (req, res, next) => multiAgentsController.unlinkAgent(req, res, next));
multiAgentsRouter.post("/:id/chat", requireAuth, (req, res, next) => multiAgentsController.chat(req, res, next));

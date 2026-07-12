import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { agentsController } from "../controllers/agents";

export const agentsRouter = Router();

agentsRouter.post("/", requireAuth, (req, res, next) => agentsController.chat(req, res, next));
agentsRouter.get("/", requireAuth, (req, res, next) => agentsController.list(req, res, next));
agentsRouter.get("/allowed", requireAuth, (req, res, next) => agentsController.listAllowed(req, res, next));
agentsRouter.get("/:slug", requireAuth, (req, res, next) => agentsController.getBySlug(req, res, next));
agentsRouter.post("/create", requireAuth, requireAdmin, (req, res, next) => agentsController.create(req, res, next));
agentsRouter.put("/:slug", requireAuth, requireAdmin, (req, res, next) => agentsController.update(req, res, next));
agentsRouter.delete("/:slug", requireAuth, requireAdmin, (req, res, next) => agentsController.remove(req, res, next));
agentsRouter.get("/:slug/tools", requireAuth, (req, res, next) => agentsController.listTools(req, res, next));
agentsRouter.post("/:slug/tools", requireAuth, requireAdmin, (req, res, next) => agentsController.linkTools(req, res, next));
agentsRouter.delete("/:slug/tools/:toolId", requireAuth, requireAdmin, (req, res, next) => agentsController.unlinkTool(req, res, next));
agentsRouter.get("/:slug/mcps", requireAuth, (req, res, next) => agentsController.listMcps(req, res, next));
agentsRouter.post("/:slug/mcps", requireAuth, requireAdmin, (req, res, next) => agentsController.linkMcps(req, res, next));
agentsRouter.delete("/:slug/mcps/:mcpId", requireAuth, requireAdmin, (req, res, next) => agentsController.unlinkMcp(req, res, next));
agentsRouter.get("/:slug/users", requireAuth, requireAdmin, (req, res, next) => agentsController.listUsers(req, res, next));
agentsRouter.post("/:slug/users", requireAuth, requireAdmin, (req, res, next) => agentsController.linkUsers(req, res, next));
agentsRouter.delete("/:slug/users/:userId", requireAuth, requireAdmin, (req, res, next) => agentsController.unlinkUser(req, res, next));
agentsRouter.get("/:slug/skills", requireAuth, (req, res, next) => agentsController.listSkills(req, res, next));
agentsRouter.post("/:slug/skills", requireAuth, requireAdmin, (req, res, next) => agentsController.linkSkills(req, res, next));
agentsRouter.delete("/:slug/skills/:skillId", requireAuth, requireAdmin, (req, res, next) => agentsController.unlinkSkill(req, res, next));
agentsRouter.post("/:slug/api-key", requireAuth, requireAdmin, (req, res, next) => agentsController.generateApiKey(req, res, next));
agentsRouter.delete("/:slug/api-key", requireAuth, requireAdmin, (req, res, next) => agentsController.revokeApiKey(req, res, next));
agentsRouter.get("/:slug/questions-no-answer", requireAuth, requireAdmin, (req, res, next) => agentsController.listQuestionsNoAnswer(req, res, next));

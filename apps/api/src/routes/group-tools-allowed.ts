import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { groupToolsAllowedController } from "../controllers/group-tools-allowed";

export const groupToolsAllowedRouter = Router();

groupToolsAllowedRouter.get("/", requireAuth, requireAdmin, (req, res, next) =>
  groupToolsAllowedController.list(req, res, next),
);
groupToolsAllowedRouter.post("/", requireAuth, requireAdmin, (req, res, next) =>
  groupToolsAllowedController.create(req, res, next),
);
groupToolsAllowedRouter.get("/:id", requireAuth, requireAdmin, (req, res, next) =>
  groupToolsAllowedController.getById(req, res, next),
);
groupToolsAllowedRouter.put("/:id", requireAuth, requireAdmin, (req, res, next) =>
  groupToolsAllowedController.update(req, res, next),
);
groupToolsAllowedRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) =>
  groupToolsAllowedController.remove(req, res, next),
);
groupToolsAllowedRouter.get("/:id/tools", requireAuth, (req, res, next) =>
  groupToolsAllowedController.listTools(req, res, next),
);
groupToolsAllowedRouter.post("/:id/tools", requireAuth, requireAdmin, (req, res, next) =>
  groupToolsAllowedController.linkTools(req, res, next),
);
groupToolsAllowedRouter.delete("/:id/tools/:toolId", requireAuth, requireAdmin, (req, res, next) =>
  groupToolsAllowedController.unlinkTool(req, res, next),
);

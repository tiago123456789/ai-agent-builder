import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { controlGroupRagController } from "../controllers/control-group-rag";

export const controlGroupRagRouter = Router();

controlGroupRagRouter.get("/", requireAuth, requireAdmin, (req, res, next) =>
  controlGroupRagController.list(req, res, next),
);
controlGroupRagRouter.post("/", requireAuth, requireAdmin, (req, res, next) =>
  controlGroupRagController.create(req, res, next),
);
controlGroupRagRouter.get("/:id", requireAuth, requireAdmin, (req, res, next) =>
  controlGroupRagController.getById(req, res, next),
);
controlGroupRagRouter.put("/:id", requireAuth, requireAdmin, (req, res, next) =>
  controlGroupRagController.update(req, res, next),
);
controlGroupRagRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) =>
  controlGroupRagController.remove(req, res, next),
);

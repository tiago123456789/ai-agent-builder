import { Router } from "express";
import { requireAdmin, requireAuth } from "../middleware/auth";
import { webhooksController } from "../controllers/webhooks";

export const webhooksRouter = Router();

webhooksRouter.get("/", requireAuth, (req, res, next) => webhooksController.list(req, res, next));
webhooksRouter.get("/integrations", requireAuth, (req, res, next) =>
  webhooksController.listIntegrations(req, res, next),
);
webhooksRouter.get("/:id", requireAuth, (req, res, next) => webhooksController.getById(req, res, next));
webhooksRouter.post("/create", requireAuth, requireAdmin, (req, res, next) =>
  webhooksController.create(req, res, next),
);
webhooksRouter.put("/:id", requireAuth, requireAdmin, (req, res, next) =>
  webhooksController.update(req, res, next),
);
webhooksRouter.delete("/:id", requireAuth, requireAdmin, (req, res, next) =>
  webhooksController.remove(req, res, next),
);

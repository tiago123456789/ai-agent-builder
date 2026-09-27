import { Router } from "express";
import { webhooksController } from "../controllers/webhooks";

export const webhookTriggerRouter = Router();

webhookTriggerRouter.post("/:slug", (req, res, next) => webhooksController.trigger(req, res, next));

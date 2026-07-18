import { Router } from "express";
import { agentsPublicInfoController } from "../controllers/agents-public-info";

export const agentsPublicInfoRouter = Router();

agentsPublicInfoRouter.get("/", (req, res, next) =>
  agentsPublicInfoController.getInfo(req, res, next),
);

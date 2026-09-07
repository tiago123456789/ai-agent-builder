import { Router } from "express";
import multer from "multer";
import { requireAuth } from "../middleware/auth";
import { transcriptionController } from "../controllers/transcription";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024,
  },
});

export const transcriptionRouter = Router();

transcriptionRouter.post(
  "/transcribe",
  requireAuth,
  upload.single("audio"),
  (req, res, next) => transcriptionController.transcribe(req, res, next),
);

transcriptionRouter.post(
  "/public/transcribe",
  upload.single("audio"),
  (req, res, next) => transcriptionController.transcribePublic(req, res, next),
);
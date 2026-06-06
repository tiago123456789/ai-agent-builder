import { Router } from "express";
import metricsAdapter from "../adapters/prometheus-metrics.adapter"

export const metricsRouter = Router();


metricsRouter.get("/", async (req, res, next) => {
    const result = (await metricsAdapter.getResultMetrics())
    res.setHeader('Content-Type', 'text/plain')
    res.send(result)
});

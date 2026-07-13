import { Router } from "express";
import { getAnalytics, recordFeedback } from "../services/analytics.js";

export const experienceRouter = Router();

experienceRouter.post("/feedback", (req, res) => {
  const rating = req.body?.rating;
  if (!['helpful', 'not_helpful'].includes(rating)) {
    return res.status(400).json({ success: false, requestId: req.requestId, error: { code: "INVALID_FEEDBACK", message: "rating must be helpful or not_helpful." } });
  }
  recordFeedback(rating);
  return res.json({ success: true, requestId: req.requestId, recorded: rating });
});

experienceRouter.get("/analytics", (req, res) => {
  return res.json({ success: true, requestId: req.requestId, analytics: getAnalytics() });
});

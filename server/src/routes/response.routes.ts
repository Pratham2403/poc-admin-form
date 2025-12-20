import express from "express";
import {
  submitResponse,
  getMyResponses,
  updateResponse,
  getResponseById,
  getMySubmissionCount,
  getFormResponses,
} from "../controllers/response.controller.ts";
import { authenticate } from "../middlewares/auth.middleware.ts";
import { heartbeat } from "../middlewares/heartbeat.middleware.ts";

const router = express.Router();

router.post("/", authenticate, heartbeat, submitResponse);
router.put("/:id", authenticate, heartbeat, updateResponse);
// Order matters! /my must come before /:id otherwise 'my' is treated as an id
router.get("/my", authenticate, heartbeat, getMyResponses);
router.get("/my/count", authenticate, heartbeat, getMySubmissionCount);
// Get paginated responses for a specific form by current user
router.get("/form/:formId", authenticate, heartbeat, getFormResponses);
router.get("/:id", authenticate, heartbeat, getResponseById);

export default router;

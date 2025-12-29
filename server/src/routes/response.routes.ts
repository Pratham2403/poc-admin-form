import express from "express";
import {
  submitResponse,
  getMyResponses,
  getMyRespondedForms,
  updateResponse,
  getResponseById,
  getMySubmissionCount,
} from "../controllers/response.controller.ts";
import { authenticate } from "../middlewares/auth.middleware.ts";
import { heartbeat } from "../middlewares/heartbeat.middleware.ts";

const router = express.Router();

router.post("/", authenticate, heartbeat, submitResponse);
router.put("/:id", authenticate, heartbeat, updateResponse);
// Order matters! /my must come before /:id otherwise 'my' is treated as an id
router.get("/my", authenticate, heartbeat, getMyResponses);
router.get("/my/forms", authenticate, heartbeat, getMyRespondedForms);
router.get("/my/count", authenticate, heartbeat, getMySubmissionCount);
router.get("/:id", authenticate, heartbeat, getResponseById);

export default router;

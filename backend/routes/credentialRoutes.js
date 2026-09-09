import express from "express";
import { asyncHandler } from "../middleware/asyncHandler.js";
import * as credentialController from "../controllers/credentialController.js";

const router = express.Router();

router.get("/", asyncHandler(credentialController.getCredentials));
router.post("/", asyncHandler(credentialController.createCredential));
router.patch("/:id", asyncHandler(credentialController.updateCredential));
router.delete("/:id", asyncHandler(credentialController.deleteCredential));

export default router;

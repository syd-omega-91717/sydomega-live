// ============================================================================
// FILE: /backend/src/routes/approvals.js
// REPLACE THE ENTIRE FILE
// ============================================================================

import { Router } from "express";

import { session } from "../middleware/session.js";
import { accessControl } from "../middleware/accessControl.js";
import { authorize } from "../middleware/rbac.js";

import * as ApprovalController from "../controllers/approval.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Founder Dashboard
|--------------------------------------------------------------------------
*/

router.get(

    "/pending",

    session,

    accessControl,

    authorize("approvals", "read"),

    ApprovalController.pending

);

router.get(

    "/approved",

    session,

    accessControl,

    authorize("approvals", "read"),

    ApprovalController.approved

);

router.get(

    "/rejected",

    session,

    accessControl,

    authorize("approvals", "read"),

    ApprovalController.rejected

);

/*
|--------------------------------------------------------------------------
| Approval Actions
|--------------------------------------------------------------------------
*/

router.post(

    "/request",

    session,

    accessControl,

    ApprovalController.request

);

router.post(

    "/:id/approve",

    session,

    accessControl,

    authorize("approvals", "approve"),

    ApprovalController.approve

);

router.post(

    "/:id/reject",

    session,

    accessControl,

    authorize("approvals", "reject"),

    ApprovalController.reject

);

router.post(

    "/renew",

    session,

    accessControl,

    ApprovalController.renew

);

/*
|--------------------------------------------------------------------------
| Access Validation
|--------------------------------------------------------------------------
*/

router.get(

    "/validate",

    session,

    accessControl,

    ApprovalController.validate

);

/*
|--------------------------------------------------------------------------
| Founder Maintenance
|--------------------------------------------------------------------------
*/

router.post(

    "/expire",

    session,

    accessControl,

    authorize("system", "manage"),

    ApprovalController.expireJob

);

export default router;

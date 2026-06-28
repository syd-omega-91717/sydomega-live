// ============================================================================
// FILE: /backend/src/modules/approval/approval.routes.ts
// NEW FILE
// ============================================================================

import { Router } from "express";

import controller from "./approval.controller.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Approval Requests
|--------------------------------------------------------------------------
*/

router.get(

    "/pending",

    controller.pending

);

router.get(

    "/approved",

    controller.approved

);

router.get(

    "/rejected",

    controller.rejected

);

router.post(

    "/",

    controller.create

);

router.post(

    "/:id/approve",

    controller.approve

);

router.post(

    "/:id/reject",

    controller.reject

);

export default router;

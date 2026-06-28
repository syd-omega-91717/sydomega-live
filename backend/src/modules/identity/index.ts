// ============================================================================
// FILE: /backend/src/modules/identity/index.ts
// NEW FILE
// ============================================================================

import { Router } from "express";

import identityRoutes from "./presentation/routes/identity.routes.js";

const router = Router();

router.use(

    "/identity",

    identityRoutes

);

export default router;

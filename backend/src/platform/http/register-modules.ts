// ============================================================================
// FILE: /backend/src/platform/http/register-modules.ts
// NEW FILE
// ============================================================================

import { Express } from "express";

import identityModule from "../../modules/identity/index.js";

export function registerModules(

    app: Express

): void {

    app.use(

        "/api/v1",

        identityModule

    );

}

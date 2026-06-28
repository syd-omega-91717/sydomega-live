// ============================================================================
// FILE: /backend/src/platform/module/bootstrap-modules.ts
// NEW FILE
// ============================================================================

import type { Express } from "express";

import registry

from "./module.registry.js";

import {

    registerModules

}

from "./modules.js";

export async function

bootstrapModules(

    app: Express

) {

    registerModules();

    await registry.boot(app);

}

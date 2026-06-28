// ============================================================================
// FILE: /backend/src/modules/identity/module.ts
// NEW FILE
// ============================================================================

import type { Express } from "express";

import identityRoutes

from "./presentation/routes/identity.routes.js";

import type {

    PlatformModule

}

from "../../platform/module/module.interface.js";

export class IdentityModule

implements PlatformModule {

    readonly id = "identity";

    readonly version = "1.0.0";

    readonly enabled = true;

    async register(

        app: Express

    ): Promise<void> {

        app.use(

            "/api/v1/identity",

            identityRoutes

        );

    }

}

export default new IdentityModule();

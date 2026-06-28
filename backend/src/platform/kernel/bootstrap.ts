// ============================================================================
// FILE: /backend/src/platform/kernel/bootstrap.ts
// NEW FILE
// ============================================================================

import express, { Express } from "express";

import kernel from "./platform.js";
import { startup } from "./startup.js";
import { registerLifecycle } from "./lifecycle.js";

export class Bootstrap {

    public async create(): Promise<Express> {

        const app = express();

        await startup();

        await kernel.boot(app);

        registerLifecycle();

        return app;

    }

}

export default new Bootstrap();

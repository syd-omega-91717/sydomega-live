// ============================================================================
// FILE: /backend/src/platform/module/module.registry.ts
// NEW FILE
// ============================================================================

import type { Express } from "express";
import type { PlatformModule } from "./module.interface.js";

export class ModuleRegistry {

    private readonly modules: PlatformModule[] = [];

    public register(

        module: PlatformModule

    ): void {

        this.modules.push(module);

    }

    public async boot(

        app: Express

    ): Promise<void> {

        for (

            const module

            of this.modules

        ) {

            if (!module.enabled)

                continue;

            await module.register(app);

        }

    }

}

export default new ModuleRegistry();

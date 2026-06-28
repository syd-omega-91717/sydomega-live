// ============================================================================
// FILE: /backend/src/platform/module/module.interface.ts
// NEW FILE
// ============================================================================

import type { Express } from "express";

export interface PlatformModule {

    readonly id: string;

    readonly version: string;

    readonly enabled: boolean;

    register(app: Express): Promise<void>;

}

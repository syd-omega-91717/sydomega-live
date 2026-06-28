// ============================================================================
// FILE: /backend/src/platform/module/modules.ts
// NEW FILE
// ============================================================================

import registry

from "./module.registry.js";

import identity

from "../../modules/identity/module.js";

export function registerModules() {

    registry.register(

        identity

    );

}

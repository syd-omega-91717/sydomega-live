// ============================================================================
// FILE: /backend/src/kernel/features/feature-provider.ts
// NEW FILE
// ============================================================================

import { FeatureContext }
from "./feature-context.js";

export interface FeatureProvider {

    isEnabled(

        feature: string,

        context: FeatureContext

    ): Promise<boolean>;

}

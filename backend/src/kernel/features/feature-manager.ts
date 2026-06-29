// ============================================================================
// FILE: /backend/src/kernel/features/feature-manager.ts
// NEW FILE
// ============================================================================

import { FeatureProvider }
from "./feature-provider.js";

import { FeatureContext }
from "./feature-context.js";

export class FeatureManager {

    constructor(

        private readonly provider: FeatureProvider

    ) {}

    async enabled(

        feature: string,

        context: FeatureContext

    ): Promise<boolean> {

        return this.provider.isEnabled(

            feature,

            context

        );

    }

}

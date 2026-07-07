// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/AnalyticsOrchestrator.ts
// ============================================================================

import {

BusinessIntelligenceEngine

}

from "./BusinessIntelligenceEngine";

export class AnalyticsOrchestrator{

    private readonly engine=

    new BusinessIntelligenceEngine();

    execute(values:number[]){

        return this.engine.analyze(

            values

        );

    }

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/analytics/BusinessIntelligenceEngine.ts
// ============================================================================

import {

ForecastEngine

}

from "./ForecastEngine";

import {

TrendAnalyzer

}

from "./TrendAnalyzer";

export class BusinessIntelligenceEngine{

    private trend=

    new TrendAnalyzer();

    private forecast=

    new ForecastEngine();

    analyze(values:number[]){

        return{

            trend:

            this.trend.direction(values),

            forecast:

            this.forecast.predict(values)

        };

    }

}

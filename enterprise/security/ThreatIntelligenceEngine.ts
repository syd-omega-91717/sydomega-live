// ============================================================================
// FILE:
// /enterprise/security/ThreatIntelligenceEngine.ts
// ============================================================================

import { ThreatIndicator } from "./ThreatIndicator";

export class ThreatIntelligenceEngine{

    analyze(

        indicator:ThreatIndicator

    ){

        return{

            indicator,

            malicious:

            indicator.confidence>0.80

        };

    }

}

// ============================================================================
// FILE:
// /enterprise/defense/ThreatIntelligenceEngine.ts
// ============================================================================

import { Threat } from "./Threat";

export class ThreatIntelligenceEngine{

    analyze(

        threat:Threat

    ){

        return{

            threat,

            analyzed:true

        };

    }

}

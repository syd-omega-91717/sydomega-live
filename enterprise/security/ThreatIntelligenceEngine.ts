// ============================================================================
// FILE:
// /enterprise/security/ThreatIntelligenceEngine.ts
// ============================================================================

import { ThreatIndicator } from "./ThreatIndicator";

export class ThreatIntelligenceEngine{

    ingest(

        indicator:ThreatIndicator

    ){

        return{

            indicator,

            indexed:true

        };

    }

}

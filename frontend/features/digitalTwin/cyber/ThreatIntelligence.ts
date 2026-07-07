// ============================================================================
// FILE:
// /frontend/features/digitalTwin/cyber/ThreatIntelligence.ts
// ============================================================================

export interface ThreatIndicator{

    id:string;

    type:string;

    confidence:number;

}

export class ThreatIntelligence{

    private indicators:

    ThreatIndicator[]=[];

    add(

        indicator:ThreatIndicator

    ){

        this.indicators.push(

            indicator

        );

    }

    all(){

        return this.indicators;

    }

}

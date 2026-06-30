// ============================================================================
// FILE: /backend/src/modules/identity/domain/value-objects/risk-score.ts
// NEW FILE
// ============================================================================

export class RiskScore {

    constructor(

        readonly value:number

    ){

        if(value < 0 || value > 100){

            throw new Error("Invalid risk score.");

        }

    }

    get isLow(){

        return this.value < 30;

    }

    get isMedium(){

        return this.value >=30 && this.value <70;

    }

    get isHigh(){

        return this.value>=70;

    }

}

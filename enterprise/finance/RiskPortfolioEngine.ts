// ============================================================================
// FILE:
// /enterprise/finance/RiskPortfolioEngine.ts
// ============================================================================

import { Portfolio } from "./Portfolio";

export class RiskPortfolioEngine{

    assess(

        portfolio:Portfolio

    ){

        return{

            portfolio,

            assessmentCompleted:true

        };

    }

}

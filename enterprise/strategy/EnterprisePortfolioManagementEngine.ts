// ============================================================================
// FILE:
// /enterprise/strategy/EnterprisePortfolioManagementEngine.ts
// ============================================================================

import { Portfolio } from "./Portfolio";

export class EnterprisePortfolioManagementEngine{

    register(

        portfolio:Portfolio

    ){

        return{

            portfolio,

            registered:true

        };

    }

}

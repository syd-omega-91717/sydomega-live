// ============================================================================
// FILE:
// /enterprise/automation/BusinessRulesEngine.ts
// ============================================================================

import { BusinessRule } from "./BusinessRule";

export class BusinessRulesEngine{

    evaluate(

        rule:BusinessRule

    ){

        return{

            rule,

            executed:true

        };

    }

}

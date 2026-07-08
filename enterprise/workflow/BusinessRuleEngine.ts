// ============================================================================
// FILE:
// /enterprise/workflow/BusinessRuleEngine.ts
// ============================================================================

export class BusinessRuleEngine{

    evaluate(

        rule:string,

        payload:unknown

    ){

        return{

            rule,

            payload,

            passed:true

        };

    }

}

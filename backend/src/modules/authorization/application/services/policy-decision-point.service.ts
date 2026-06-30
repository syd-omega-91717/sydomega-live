// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/policy-decision-point.service.ts
// NEW FILE
// ============================================================================

export interface PolicyDecisionPointService{

    evaluate(

        subjectId:string,

        resource:string,

        action:string,

        context:Record<string,unknown>

    ):Promise<boolean>;

}

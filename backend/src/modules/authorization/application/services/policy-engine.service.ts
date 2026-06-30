// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/policy-engine.service.ts
// NEW FILE
// ============================================================================

export interface PolicyEngineService{

    evaluate(

        subjectId:string,

        resource:string,

        action:string,

        context:Record<string,unknown>

    ):Promise<boolean>;

}

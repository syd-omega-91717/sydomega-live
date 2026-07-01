// ============================================================================
// FILE: /backend/src/modules/authorization/application/services/attribute-provider.service.ts
// NEW FILE
// ============================================================================

export interface AttributeProviderService{

    resolve(

        subjectId:string,

        resource:string

    ):Promise<Record<string,unknown>>;

}

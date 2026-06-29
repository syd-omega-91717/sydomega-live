// ============================================================================
// FILE: /backend/src/modules/organization/domain/repositories/organization-widget.repository.ts
// NEW FILE
// ============================================================================

export interface OrganizationWidgetRepository{

    metrics(

        organizationId:string

    ):Promise<unknown>;

}

// ============================================================================
// FILE: /backend/src/modules/organization/application/commands/create-workspace.command.ts
// NEW FILE
// ============================================================================

export interface CreateWorkspaceCommand {

    organizationId: string;

    name: string;

    description?: string;

    isDefault?: boolean;

}

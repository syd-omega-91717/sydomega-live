// ============================================================================
// FILE:
// /enterprise/api/WebhookDefinition.ts
// ============================================================================

export interface WebhookDefinition{

    id:string;

    event:string;

    callbackUrl:string;

    enabled:boolean;

}

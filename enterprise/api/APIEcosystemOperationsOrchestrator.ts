// ============================================================================
// FILE:
// /enterprise/api/APIEcosystemOperationsOrchestrator.ts
// ============================================================================

import { APICatalogEngine } from "./APICatalogEngine";
import { APIGatewayManagementEngine } from "./APIGatewayManagementEngine";
import { APIMonetizationEngine } from "./APIMonetizationEngine";
import { APIVersioningEngine } from "./APIVersioningEngine";
import { DeveloperWorkspaceEngine } from "./DeveloperWorkspaceEngine";
import { EventAPIPlatformEngine } from "./EventAPIPlatformEngine";
import { IntegrationMarketplaceEngine } from "./IntegrationMarketplaceEngine";
import { SDKGenerationEngine } from "./SDKGenerationEngine";
import { WebhookRegistryEngine } from "./WebhookRegistryEngine";

export class APIEcosystemOperationsOrchestrator{

    readonly gateway=new APIGatewayManagementEngine();

    readonly catalog=new APICatalogEngine();

    readonly versioning=new APIVersioningEngine();

    readonly sdk=new SDKGenerationEngine();

    readonly webhooks=new WebhookRegistryEngine();

    readonly events=new EventAPIPlatformEngine();

    readonly monetization=new APIMonetizationEngine();

    readonly marketplace=new IntegrationMarketplaceEngine();

    readonly developers=new DeveloperWorkspaceEngine();

}

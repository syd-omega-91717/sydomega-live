// ============================================================================
// FILE:
// /enterprise/integration/IntegrationOrchestrator.ts
// ============================================================================

import { APIRegistry } from "./APIRegistry";
import { DataFederationEngine } from "./DataFederationEngine";
import { EnterpriseServiceBus } from "./EnterpriseServiceBus";
import { ETLPipeline } from "./ETLPipeline";
import { EventStreamingEngine } from "./EventStreamingEngine";
import { GraphQLGateway } from "./GraphQLGateway";
import { MessageQueue } from "./MessageQueue";
import { RestGateway } from "./RestGateway";
import { WebhookEngine } from "./WebhookEngine";

export class IntegrationOrchestrator{

    readonly rest=

    new RestGateway();

    readonly graphql=

    new GraphQLGateway();

    readonly esb=

    new EnterpriseServiceBus();

    readonly webhooks=

    new WebhookEngine();

    readonly streaming=

    new EventStreamingEngine();

    readonly queues=

    new MessageQueue();

    readonly etl=

    new ETLPipeline();

    readonly federation=

    new DataFederationEngine();

    readonly registry=

    new APIRegistry();

}

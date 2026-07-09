// ============================================================================
// FILE:
// /enterprise/api/WebhookRegistryEngine.ts
// ============================================================================

import { WebhookDefinition } from "./WebhookDefinition";

export class WebhookRegistryEngine{

    register(

        webhook:WebhookDefinition

    ){

        return{

            webhook,

            registered:true

        };

    }

}

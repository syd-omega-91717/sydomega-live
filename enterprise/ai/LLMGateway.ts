// ============================================================================
// FILE:
// /enterprise/ai/LLMGateway.ts
// ============================================================================

import { LLMProvider } from "./LLMProvider";

export class LLMGateway{

    private readonly providers=

    new Map<string,LLMProvider>();

    register(

        provider:LLMProvider

    ){

        this.providers.set(

            provider.id,

            provider

        );

    }

    available(){

        return [...this.providers.values()];

    }

}

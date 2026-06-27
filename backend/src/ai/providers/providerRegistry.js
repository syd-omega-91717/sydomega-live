// ============================================================================
// FILE: /backend/src/ai/providers/providerRegistry.js
// ============================================================================

import OpenAIProvider from "./providers/openai.provider.js";
import AnthropicProvider from "./providers/anthropic.provider.js";
import GeminiProvider from "./providers/gemini.provider.js";
import LocalProvider from "./providers/local.provider.js";

const providers={

    openai:new OpenAIProvider(),

    anthropic:new AnthropicProvider(),

    gemini:new GeminiProvider(),

    local:new LocalProvider()

};

export function resolve(provider="openai"){

    if(!providers[provider])

        throw new Error(

            `Unknown AI Provider: ${provider}`

        );

    return providers[provider];

}

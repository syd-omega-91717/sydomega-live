// ============================================================================
// FILE: /backend/src/ai/orchestrator/AIOrchestrator.js
// ============================================================================

import * as ProviderRegistry from "../providers/providerRegistry.js";
import * as ConversationService from "../chat/conversation.service.js";
import * as MemoryService from "../memory/memory.service.js";
import * as PromptService from "../prompts/prompt.service.js";
import * as JobService from "../jobs/job.service.js";

class AIOrchestrator {

    async chat({

        userId,

        conversationId,

        prompt,

        provider,

        model,

        metadata={}

    }){

        const conversation=

            await ConversationService.loadOrCreate(

                userId,

                conversationId

            );

        const memory=

            await MemoryService.retrieve(

                userId,

                prompt

            );

        const systemPrompt=

            await PromptService.build({

                userId,

                conversation,

                memory,

                metadata

            });

        const client=

            ProviderRegistry.resolve(

                provider,

                model

            );

        const completion=

            await client.chat({

                systemPrompt,

                prompt,

                conversation,

                memory

            });

        await ConversationService.storeUserMessage(

            conversation.id,

            prompt

        );

        await ConversationService.storeAssistantMessage(

            conversation.id,

            completion

        );

        await MemoryService.learn(

            userId,

            prompt,

            completion

        );

        return completion;

    }

    async enqueue(job){

        return JobService.enqueue(job);

    }

}

export default new AIOrchestrator();

// ============================================================================
// FILE:
// /core/ai/AIRuntime.ts
// ============================================================================

import { AgentRegistry } from "./AgentRegistry";
import { ConversationEngine } from "./ConversationEngine";
import { KnowledgeIndex } from "./KnowledgeIndex";
import { MemoryEngine } from "./MemoryEngine";
import { ModelRouter } from "./ModelRouter";
import { PromptOrchestrator } from "./PromptOrchestrator";
import { ReasoningEngine } from "./ReasoningEngine";
import { VectorStore } from "./VectorStore";
import { WorkflowEngine } from "./WorkflowEngine";

export class AIRuntime{

    readonly registry=

    new AgentRegistry();

    readonly memory=

    new MemoryEngine();

    readonly reasoning=

    new ReasoningEngine();

    readonly prompts=

    new PromptOrchestrator();

    readonly knowledge=

    new KnowledgeIndex();

    readonly vectors=

    new VectorStore();

    readonly router=

    new ModelRouter();

    readonly conversations=

    new ConversationEngine();

    readonly workflows=

    new WorkflowEngine();

}

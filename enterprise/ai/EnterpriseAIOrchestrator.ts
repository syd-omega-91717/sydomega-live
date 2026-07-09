// ============================================================================
// FILE:
// /enterprise/ai/EnterpriseAIOrchestrator.ts
// ============================================================================

import { AgentMemoryEngine } from "./AgentMemoryEngine";
import { AgentRuntime } from "./AgentRuntime";
import { KnowledgeGraphEngine } from "./KnowledgeGraphEngine";
import { LLMGateway } from "./LLMGateway";
import { MultiAgentCollaborationEngine } from "./MultiAgentCollaborationEngine";
import { PromptOrchestrationEngine } from "./PromptOrchestrationEngine";
import { RAGEngine } from "./RAGEngine";
import { VectorDatabaseEngine } from "./VectorDatabaseEngine";
import { WorkflowAutomationEngine } from "./WorkflowAutomationEngine";

export class EnterpriseAIOrchestrator{

    readonly llm=

    new LLMGateway();

    readonly runtime=

    new AgentRuntime();

    readonly memory=

    new AgentMemoryEngine();

    readonly rag=

    new RAGEngine();

    readonly vectors=

    new VectorDatabaseEngine();

    readonly graph=

    new KnowledgeGraphEngine();

    readonly prompts=

    new PromptOrchestrationEngine();

    readonly workflows=

    new WorkflowAutomationEngine();

    readonly collaboration=

    new MultiAgentCollaborationEngine();

}

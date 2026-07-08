// ============================================================================
// FILE:
// /enterprise/ai/SovereignAIOrchestrator.ts
// ============================================================================

import { AgentCommunicationBus } from "./AgentCommunicationBus";
import { AgentRegistry } from "./AgentRegistry";
import { EnterpriseCopilot } from "./EnterpriseCopilot";
import { MemoryEngine } from "./MemoryEngine";
import { ModelRouter } from "./ModelRouter";
import { MultiAgentCoordinator } from "./MultiAgentCoordinator";
import { PlanningEngine } from "./PlanningEngine";
import { TaskDecompositionEngine } from "./TaskDecompositionEngine";
import { ToolRegistry } from "./ToolRegistry";

export class SovereignAIOrchestrator{

    readonly agents=

    new AgentRegistry();

    readonly tools=

    new ToolRegistry();

    readonly memory=

    new MemoryEngine();

    readonly planner=

    new PlanningEngine();

    readonly decomposition=

    new TaskDecompositionEngine();

    readonly router=

    new ModelRouter();

    readonly communication=

    new AgentCommunicationBus();

    readonly coordination=

    new MultiAgentCoordinator();

    readonly copilot=

    new EnterpriseCopilot();

}

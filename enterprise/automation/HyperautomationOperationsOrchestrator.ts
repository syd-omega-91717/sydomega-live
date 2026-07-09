// ============================================================================
// FILE:
// /enterprise/automation/HyperautomationOperationsOrchestrator.ts
// ============================================================================

import { AIDecisionAutomationEngine } from "./AIDecisionAutomationEngine";
import { BPMNWorkflowEngine } from "./BPMNWorkflowEngine";
import { BusinessRulesEngine } from "./BusinessRulesEngine";
import { EventAutomationEngine } from "./EventAutomationEngine";
import { IntelligentDocumentProcessingEngine } from "./IntelligentDocumentProcessingEngine";
import { LowCodeAutomationEngine } from "./LowCodeAutomationEngine";
import { ProcessMiningEngine } from "./ProcessMiningEngine";
import { ProcessPerformanceAnalyticsEngine } from "./ProcessPerformanceAnalyticsEngine";
import { RPAEngine } from "./RPAEngine";

export class HyperautomationOperationsOrchestrator{

    readonly workflow=new BPMNWorkflowEngine();

    readonly rules=new BusinessRulesEngine();

    readonly rpa=new RPAEngine();

    readonly lowCode=new LowCodeAutomationEngine();

    readonly events=new EventAutomationEngine();

    readonly idp=new IntelligentDocumentProcessingEngine();

    readonly ai=new AIDecisionAutomationEngine();

    readonly mining=new ProcessMiningEngine();

    readonly analytics=new ProcessPerformanceAnalyticsEngine();

}

// ============================================================================
// FILE:
// /enterprise/automation/AutomationRuntime.ts
// ============================================================================

import { AutomationMonitoringEngine } from "./AutomationMonitoringEngine";
import { AutomationScheduler } from "./AutomationScheduler";
import { DigitalWorkerEngine } from "./DigitalWorkerEngine";
import { DocumentProcessingEngine } from "./DocumentProcessingEngine";
import { OCREngine } from "./OCREngine";
import { RobotOrchestrator } from "./RobotOrchestrator";
import { RPAEngine } from "./RPAEngine";
import { UnattendedExecutionEngine } from "./UnattendedExecutionEngine";
import { WorkflowBotEngine } from "./WorkflowBotEngine";

export class AutomationRuntime{

    readonly rpa=

    new RPAEngine();

    readonly orchestrator=

    new RobotOrchestrator();

    readonly workers=

    new DigitalWorkerEngine();

    readonly workflowBots=

    new WorkflowBotEngine();

    readonly unattended=

    new UnattendedExecutionEngine();

    readonly ocr=

    new OCREngine();

    readonly documents=

    new DocumentProcessingEngine();

    readonly scheduler=

    new AutomationScheduler();

    readonly monitoring=

    new AutomationMonitoringEngine();

}

// ============================================================================
// FILE:
// /enterprise/workflow/WorkflowRuntime.ts
// ============================================================================

import { ApprovalEngine } from "./ApprovalEngine";
import { BPMNWorkflowEngine } from "./BPMNWorkflowEngine";
import { BusinessRuleEngine } from "./BusinessRuleEngine";
import { SchedulerEngine } from "./SchedulerEngine";
import { SLAMonitor } from "./SLAMonitor";
import { TaskEngine } from "./TaskEngine";
import { WorkflowAnalyticsEngine } from "./WorkflowAnalyticsEngine";
import { WorkflowExecutionEngine } from "./WorkflowExecutionEngine";
import { WorkflowNotificationEngine } from "./WorkflowNotificationEngine";
import { WorkflowRepository } from "./WorkflowRepository";

export class WorkflowRuntime{

    readonly repository=

    new WorkflowRepository();

    readonly deployment=

    new BPMNWorkflowEngine();

    readonly execution=

    new WorkflowExecutionEngine();

    readonly tasks=

    new TaskEngine();

    readonly approvals=

    new ApprovalEngine();

    readonly rules=

    new BusinessRuleEngine();

    readonly scheduler=

    new SchedulerEngine();

    readonly sla=

    new SLAMonitor();

    readonly notifications=

    new WorkflowNotificationEngine();

    readonly analytics=

    new WorkflowAnalyticsEngine();

}

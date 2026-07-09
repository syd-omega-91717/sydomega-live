// ============================================================================
// FILE:
// /enterprise/robotics/RoboticsOperationsOrchestrator.ts
// ============================================================================

import { AMRCoordinationEngine } from "./AMRCoordinationEngine";
import { AutonomousTaskPlanningEngine } from "./AutonomousTaskPlanningEngine";
import { DigitalRobotTwinEngine } from "./DigitalRobotTwinEngine";
import { HumanRobotCollaborationEngine } from "./HumanRobotCollaborationEngine";
import { HumanoidRobotEngine } from "./HumanoidRobotEngine";
import { MachineVisionEngine } from "./MachineVisionEngine";
import { RoboticsFleetEngine } from "./RoboticsFleetEngine";
import { RPAEngine } from "./RPAEngine";
import { SwarmIntelligenceEngine } from "./SwarmIntelligenceEngine";

export class RoboticsOperationsOrchestrator{

    readonly fleet=new RoboticsFleetEngine();

    readonly amr=new AMRCoordinationEngine();

    readonly humanoids=new HumanoidRobotEngine();

    readonly rpa=new RPAEngine();

    readonly vision=new MachineVisionEngine();

    readonly twins=new DigitalRobotTwinEngine();

    readonly collaboration=new HumanRobotCollaborationEngine();

    readonly planner=new AutonomousTaskPlanningEngine();

    readonly swarm=new SwarmIntelligenceEngine();

}

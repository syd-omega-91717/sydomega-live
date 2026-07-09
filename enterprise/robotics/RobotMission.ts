// ============================================================================
// FILE:
// /enterprise/robotics/RobotMission.ts
// ============================================================================

export interface RobotMission{

    id:string;

    robotId:string;

    objective:string;

    priority:number;

    completed:boolean;

}

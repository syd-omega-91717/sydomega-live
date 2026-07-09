// ============================================================================
// ENTERPRISE CORE EC-036
// FILE:
// /enterprise/robotics/Robot.ts
// ============================================================================

export interface Robot{

    id:string;

    name:string;

    type:"AMR"|"AGV"|"HUMANOID"|"ARM"|"DRONE";

    status:string;

    batteryLevel:number;

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/SensorAdapter.ts
// ============================================================================

export interface SensorReading{

    sensorId:string;

    timestamp:number;

    value:number;

    unit:string;

}

export abstract class SensorAdapter{

    abstract read():

    Promise<SensorReading>;

}

// ============================================================================
// FILE:
// /frontend/features/digitalTwin/iot/DeviceHealthMonitor.ts
// ============================================================================

export class DeviceHealthMonitor{

    evaluate(

        latency:number,

        packetLoss:number

    ){

        if(

            latency>500||

            packetLoss>20

        ){

            return"CRITICAL";

        }

        if(

            latency>200||

            packetLoss>10

        ){

            return"WARNING";

        }

        return"ONLINE";

    }

}

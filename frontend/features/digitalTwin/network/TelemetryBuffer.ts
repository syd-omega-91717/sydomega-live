// ============================================================================
// FILE:
// /frontend/features/digitalTwin/network/TelemetryBuffer.ts
// ============================================================================

export class TelemetryBuffer{

    private queue:any[]=[];

    push(packet:any){

        this.queue.push(packet);

    }

    drain(){

        const packets=[...this.queue];

        this.queue=[];

        return packets;

    }

}

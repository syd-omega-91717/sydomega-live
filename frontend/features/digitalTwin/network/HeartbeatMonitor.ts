// ============================================================================
// FILE:
// /frontend/features/digitalTwin/network/HeartbeatMonitor.ts
// ============================================================================

export class HeartbeatMonitor{

    private lastHeartbeat=0;

    beat(){

        this.lastHeartbeat=Date.now();

    }

    healthy(

        timeout=10000

    ){

        return Date.now()-this.lastHeartbeat

        < timeout;

    }

}

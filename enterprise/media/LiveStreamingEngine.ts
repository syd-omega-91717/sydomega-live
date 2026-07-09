// ============================================================================
// FILE:
// /enterprise/media/LiveStreamingEngine.ts
// ============================================================================

import { LiveBroadcast } from "./LiveBroadcast";

export class LiveStreamingEngine{

    start(

        broadcast:LiveBroadcast

    ){

        return{

            broadcast,

            streaming:true

        };

    }

}

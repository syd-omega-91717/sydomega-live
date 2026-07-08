// ============================================================================
// FILE:
// /enterprise/integration/EventStreamingEngine.ts
// ============================================================================

export class EventStreamingEngine{

    async stream(

        channel:string,

        event:unknown

    ){

        return{

            channel,

            event,

            streamed:true

        };

    }

}

// ============================================================================
// FILE:
// /core/digital-twin/EventEngine.ts
// ============================================================================

export class EventEngine{

    publish(

        event:string,

        payload:unknown

    ){

        return{

            event,

            payload,

            timestamp:Date.now()

        };

    }

}

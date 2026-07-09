// ============================================================================
// FILE:
// /enterprise/api/EventAPIPlatformEngine.ts
// ============================================================================

export class EventAPIPlatformEngine{

    emit(

        eventName:string

    ){

        return{

            eventName,

            delivered:true

        };

    }

}

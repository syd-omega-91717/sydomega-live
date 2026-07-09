// ============================================================================
// FILE:
// /enterprise/automation/EventAutomationEngine.ts
// ============================================================================

export class EventAutomationEngine{

    subscribe(

        eventName:string

    ){

        return{

            eventName,

            subscribed:true

        };

    }

}

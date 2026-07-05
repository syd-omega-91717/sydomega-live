// ============================================================================
// FILE:
// /frontend/features/digitalTwin/network/TelemetryDispatcher.ts
// ============================================================================

export type TelemetryListener=

(packet:any)=>void;

export class TelemetryDispatcher{

    private listeners=

    new Set<TelemetryListener>();

    subscribe(

        listener:TelemetryListener

    ){

        this.listeners.add(listener);

    }

    unsubscribe(

        listener:TelemetryListener

    ){

        this.listeners.delete(listener);

    }

    dispatch(packet:any){

        this.listeners.forEach(

            listener=>listener(packet)

        );

    }

}

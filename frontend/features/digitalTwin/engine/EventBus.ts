// ============================================================================
// FILE:
// /frontend/features/digitalTwin/engine/EventBus.ts
// ============================================================================

export type TwinEventHandler<T=unknown>=(payload:T)=>void;

export class EventBus{

    private readonly handlers=

    new Map<string,Set<TwinEventHandler>>();

    on<T>(

        event:string,

        handler:TwinEventHandler<T>

    ){

        if(!this.handlers.has(event)){

            this.handlers.set(

                event,

                new Set()

            );

        }

        this.handlers.get(event)!.add(

            handler as TwinEventHandler

        );

    }

    off<T>(

        event:string,

        handler:TwinEventHandler<T>

    ){

        this.handlers.get(event)?.delete(

            handler as TwinEventHandler

        );

    }

    emit<T>(

        event:string,

        payload:T

    ){

        this.handlers.get(event)?.forEach(

            handler=>handler(payload)

        );

    }

}

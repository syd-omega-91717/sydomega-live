// ============================================================================
// FILE:
// /frontend/features/digitalTwin/infrastructure/MessageBus.ts
// ============================================================================

export class MessageBus{

    private subscribers=

    new Map<string,

    Set<(payload:any)=>void>>();

    subscribe(

        topic:string,

        handler:(payload:any)=>void

    ){

        if(

            !this.subscribers.has(topic)

        ){

            this.subscribers.set(

                topic,

                new Set()

            );

        }

        this.subscribers

        .get(topic)!

        .add(handler);

    }

    publish(

        topic:string,

        payload:any

    ){

        this.subscribers

        .get(topic)

        ?.forEach(

            handler=>handler(payload)

        );

    }

}

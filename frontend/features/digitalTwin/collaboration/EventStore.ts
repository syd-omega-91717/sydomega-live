// ============================================================================
// FILE:
// /frontend/features/digitalTwin/collaboration/EventStore.ts
// ============================================================================

export interface DomainEvent{

    id:string;

    aggregateId:string;

    type:string;

    payload:any;

    timestamp:number;

}

export class EventStore{

    private readonly events:DomainEvent[]=[];

    append(

        event:DomainEvent

    ){

        this.events.push(event);

    }

    aggregate(

        aggregateId:string

    ){

        return this.events.filter(

            e=>e.aggregateId===aggregateId

        );

    }

}
